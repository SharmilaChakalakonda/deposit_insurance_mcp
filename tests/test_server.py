"""Comprehensive Test Suite for FDIC Deposit Insurance MCP Server.

Validates:
1. Single, Joint, Trust, Business, Government, and Retirement account calculations
2. April 1, 2024 Trust Rule simplification (5-beneficiary cap)
3. Government in-state vs out-of-state dual pool rules
4. FastAPI endpoints (/health, /, /api/calculate, /api/guidance)
5. MCP Streamable HTTP transport and JSON-RPC tool invocations
"""

import json
import pytest
from pydantic import ValidationError
from starlette.testclient import TestClient
from server import app, calculate_deposit_insurance, get_insurance_rule_guidance
from deposit_insurance_engine import (
    AccountCategory,
    AccountInput,
    DepositType,
    Jurisdiction,
    calculate_portfolio_insurance,
    get_rule_guidance,
)


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


# =====================================================================
# 1. SINGLE ACCOUNT TESTS (12 CFR § 330.6)
# =====================================================================
def test_single_account_under_limit():
    acc = AccountInput(account_id="S-1", category=AccountCategory.SINGLE, balance=180000.0, owners=["Alice"])
    res = calculate_portfolio_insurance([acc])
    assert res.summary.total_balance == 180000.0
    assert res.summary.total_insured == 180000.0
    assert res.summary.total_uninsured == 0.0
    assert res.summary.is_fully_insured is True


def test_single_account_over_limit():
    acc = AccountInput(account_id="S-2", category=AccountCategory.SINGLE, balance=350000.0, owners=["Alice"])
    res = calculate_portfolio_insurance([acc])
    assert res.summary.total_balance == 350000.0
    assert res.summary.total_insured == 250000.0
    assert res.summary.total_uninsured == 100000.0
    assert res.summary.is_fully_insured is False
    assert len(res.actionable_recommendations) > 0


def test_multiple_single_accounts_aggregation():
    # Alice has checking $150k and CD $150k at same bank = $300k total ($250k insured, $50k uninsured)
    acc1 = AccountInput(account_id="S-3A", category=AccountCategory.SINGLE, balance=150000.0, owners=["Alice"])
    acc2 = AccountInput(account_id="S-3B", category=AccountCategory.SINGLE, balance=150000.0, owners=["Alice"])
    res = calculate_portfolio_insurance([acc1, acc2])
    assert res.summary.total_balance == 300000.0
    assert res.summary.total_insured == 250000.0
    assert res.summary.total_uninsured == 50000.0


def test_sole_proprietorship_dba_aggregates_to_single():
    # Sole proprietorship DBA is legally the single account of the owner (12 CFR § 330.6)
    personal = AccountInput(account_id="P-1", category=AccountCategory.SINGLE, balance=200000.0, owners=["Bob"])
    dba = AccountInput(
        account_id="DBA-1",
        category=AccountCategory.BUSINESS,
        balance=100000.0,
        owners=["Bob"],
        is_sole_proprietorship=True,
        business_name="Bob's Consulting Services"
    )
    res = calculate_portfolio_insurance([personal, dba])
    assert res.summary.total_balance == 300000.0
    assert res.summary.total_insured == 250000.0
    assert res.summary.total_uninsured == 50000.0


# =====================================================================
# 2. JOINT ACCOUNT TESTS (12 CFR § 330.9)
# =====================================================================
def test_joint_account_equal_split():
    # 2 owners, $500k -> each owner has $250k interest -> 100% insured
    acc = AccountInput(account_id="J-1", category=AccountCategory.JOINT, balance=500000.0, owners=["Alice", "Bob"])
    res = calculate_portfolio_insurance([acc])
    assert res.summary.total_balance == 500000.0
    assert res.summary.total_insured == 500000.0
    assert res.summary.total_uninsured == 0.0
    assert res.summary.is_fully_insured is True


def test_joint_account_exceeding_limit():
    # 2 owners, $700k -> each owner has $350k interest -> $250k insured each = $500k insured, $200k uninsured
    acc = AccountInput(account_id="J-2", category=AccountCategory.JOINT, balance=700000.0, owners=["Alice", "Bob"])
    res = calculate_portfolio_insurance([acc])
    assert res.summary.total_balance == 700000.0
    assert res.summary.total_insured == 500000.0
    assert res.summary.total_uninsured == 200000.0


def test_multiple_joint_accounts_cross_ownership():
    # Account 1: Alice & Bob ($400k) -> $200k Alice, $200k Bob
    # Account 2: Alice & Charlie ($200k) -> $100k Alice, $100k Charlie
    # Alice total joint interest = $300k ($250k insured, $50k uninsured)
    # Bob total joint interest = $200k ($200k insured)
    # Charlie total joint interest = $100k ($100k insured)
    # Total portfolio: $600k balance, $550k insured, $50k uninsured
    j1 = AccountInput(account_id="J-A1", category=AccountCategory.JOINT, balance=400000.0, owners=["Alice", "Bob"])
    j2 = AccountInput(account_id="J-A2", category=AccountCategory.JOINT, balance=200000.0, owners=["Alice", "Charlie"])
    res = calculate_portfolio_insurance([j1, j2])
    assert res.summary.total_balance == 600000.0
    assert res.summary.total_insured == 550000.0
    assert res.summary.total_uninsured == 50000.0


# =====================================================================
# 3. TRUST ACCOUNT TESTS (12 CFR § 330.10 - April 1, 2024 Rule)
# =====================================================================
def test_trust_under_limit():
    # 1 grantor, 3 beneficiaries -> limit = 1 * 3 * $250k = $750k. Balance = $600k -> fully insured
    acc = AccountInput(
        account_id="T-1",
        category=AccountCategory.TRUST,
        balance=600000.0,
        owners=["Alice"],
        beneficiaries=["Child 1", "Child 2", "Child 3"]
    )
    res = calculate_portfolio_insurance([acc])
    assert res.summary.total_insured == 600000.0
    assert res.summary.total_uninsured == 0.0
    assert res.summary.is_fully_insured is True


def test_trust_beneficiary_cap_5():
    # 1 grantor, 8 beneficiaries.
    # Under April 1, 2024 simplified rule, beneficiaries are capped at 5 per grantor ($1,250,000 max limit)
    # Balance = $1,500,000 -> $1,250,000 insured, $250,000 uninsured
    acc = AccountInput(
        account_id="T-2",
        category=AccountCategory.TRUST,
        balance=1500000.0,
        owners=["Alice"],
        beneficiaries=[f"Beneficiary {i}" for i in range(1, 9)]
    )
    res = calculate_portfolio_insurance([acc])
    assert res.summary.total_balance == 1500000.0
    assert res.summary.total_insured == 1250000.0
    assert res.summary.total_uninsured == 250000.0


def test_trust_two_grantors():
    # 2 grantors (e.g. married couple), 5 beneficiaries.
    # Limit = 2 * 5 * $250k = $2,500,000.
    # Balance = $2,200,000 -> 100% insured
    acc = AccountInput(
        account_id="T-3",
        category=AccountCategory.TRUST,
        balance=2200000.0,
        owners=["Alice", "Bob"],
        beneficiaries=["B1", "B2", "B3", "B4", "B5"]
    )
    res = calculate_portfolio_insurance([acc])
    assert res.summary.total_balance == 2200000.0
    assert res.summary.total_insured == 2200000.0
    assert res.summary.is_fully_insured is True


# =====================================================================
# 4. BUSINESS ACCOUNT TESTS (12 CFR § 330.11)
# =====================================================================
def test_business_account_limit():
    acc = AccountInput(
        account_id="B-1",
        category=AccountCategory.BUSINESS,
        balance=400000.0,
        business_name="Acme Corp"
    )
    res = calculate_portfolio_insurance([acc])
    assert res.summary.total_balance == 400000.0
    assert res.summary.total_insured == 250000.0
    assert res.summary.total_uninsured == 150000.0


def test_business_separate_from_personal():
    # Alice personal single $250k + Alice Corp $250k = $500k total, 100% insured
    p = AccountInput(account_id="P-A", category=AccountCategory.SINGLE, balance=250000.0, owners=["Alice"])
    b = AccountInput(account_id="B-A", category=AccountCategory.BUSINESS, balance=250000.0, business_name="Alice Consulting LLC")
    res = calculate_portfolio_insurance([p, b])
    assert res.summary.total_balance == 500000.0
    assert res.summary.total_insured == 500000.0
    assert res.summary.total_uninsured == 0.0


# =====================================================================
# 5. GOVERNMENT / PUBLIC UNIT TESTS (12 CFR § 330.15)
# =====================================================================
def test_government_in_state_dual_pools():
    # In-state official custodian has dual pools:
    # Demand deposits (checking) up to $250k + Time/Savings (CD) up to $250k (up to $500k total)
    demand = AccountInput(
        account_id="G-1",
        category=AccountCategory.GOVERNMENT,
        balance=300000.0,
        deposit_type=DepositType.CHECKING,
        jurisdiction=Jurisdiction.IN_STATE,
        official_custodian="County Treasurer"
    )
    time_cd = AccountInput(
        account_id="G-2",
        category=AccountCategory.GOVERNMENT,
        balance=250000.0,
        deposit_type=DepositType.CD,
        jurisdiction=Jurisdiction.IN_STATE,
        official_custodian="County Treasurer"
    )
    res = calculate_portfolio_insurance([demand, time_cd])
    # Demand insured = 250k, Time insured = 250k -> Total insured = 500k, uninsured = 50k
    assert res.summary.total_balance == 550000.0
    assert res.summary.total_insured == 500000.0
    assert res.summary.total_uninsured == 50000.0


def test_government_out_of_state_single_pool():
    # Out-of-state bank caps all deposits combined at $250k
    demand = AccountInput(
        account_id="G-3",
        category=AccountCategory.GOVERNMENT,
        balance=200000.0,
        deposit_type=DepositType.CHECKING,
        jurisdiction=Jurisdiction.OUT_OF_STATE,
        official_custodian="City Comptroller"
    )
    savings = AccountInput(
        account_id="G-4",
        category=AccountCategory.GOVERNMENT,
        balance=150000.0,
        deposit_type=DepositType.SAVINGS,
        jurisdiction=Jurisdiction.OUT_OF_STATE,
        official_custodian="City Comptroller"
    )
    res = calculate_portfolio_insurance([demand, savings])
    assert res.summary.total_balance == 350000.0
    assert res.summary.total_insured == 250000.0
    assert res.summary.total_uninsured == 100000.0


# =====================================================================
# 6. RETIREMENT ACCOUNT TESTS (12 CFR § 330.14)
# =====================================================================
def test_retirement_separate_coverage():
    # Single checking $250k + Traditional IRA $250k = $500k total, 100% insured
    chk = AccountInput(account_id="S-R1", category=AccountCategory.SINGLE, balance=250000.0, owners=["Alice"])
    ira = AccountInput(account_id="IRA-1", category=AccountCategory.RETIREMENT, balance=250000.0, owners=["Alice"])
    res = calculate_portfolio_insurance([chk, ira])
    assert res.summary.total_balance == 500000.0
    assert res.summary.total_insured == 500000.0
    assert res.summary.total_uninsured == 0.0


# =====================================================================
# 7. MULTI-BANK PORTFOLIO TESTS
# =====================================================================
def test_multi_bank_portfolio():
    # Same owner Alice has $250k at Bank A and $250k at Bank B = $500k, 100% insured across institutions
    acc_a = AccountInput(account_id="A-1", category=AccountCategory.SINGLE, balance=250000.0, bank_name="First National", owners=["Alice"])
    acc_b = AccountInput(account_id="B-1", category=AccountCategory.SINGLE, balance=250000.0, bank_name="State Commerce Bank", owners=["Alice"])
    res = calculate_portfolio_insurance([acc_a, acc_b])
    assert res.summary.total_balance == 500000.0
    assert res.summary.total_insured == 500000.0
    assert res.summary.institutions_count == 2
    assert "First National" in res.bank_summaries
    assert "State Commerce Bank" in res.bank_summaries


# =====================================================================
# 8. FASTAPI ENDPOINTS & COMPLIANCE TESTS
# =====================================================================
def test_fastapi_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "healthy"
    assert data["service"] == "deposit-insurance-calculator-mcp"
    assert "calculate_deposit_insurance" in data["tools_loaded"]


def test_fastapi_root(client):
    r = client.get("/")
    assert r.status_code == 200
    data = r.json()
    assert "12 CFR Part 330" in data["compliance"]


def test_fastapi_rest_calculate(client):
    payload = [
        {"account_id": "R-1", "category": "single", "balance": 150000.0, "owners": ["Alice"]},
        {"account_id": "R-2", "category": "joint", "balance": 400000.0, "owners": ["Alice", "Bob"]}
    ]
    r = client.post("/api/calculate", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["summary"]["total_balance"] == 550000.0
    assert data["summary"]["is_fully_insured"] is True


def test_fastapi_rest_guidance(client):
    r = client.get("/api/guidance?category=trust")
    assert r.status_code == 200
    data = r.json()
    assert "April 1, 2024" in data["statutory_authority"]


# =====================================================================
# 9. MCP STREAMABLE HTTP JSON-RPC TESTS
# =====================================================================
def test_mcp_tools_list(client):
    payload = {
        "jsonrpc": "2.0",
        "id": 100,
        "method": "tools/list"
    }
    r = client.post("/mcp/", json=payload, headers={"accept": "application/json, text/event-stream"})
    assert r.status_code == 200
    # Response contains tools
    assert "calculate_deposit_insurance" in r.text
    assert "get_insurance_rule_guidance" in r.text


def test_mcp_calculate_tool_invocation(client):
    payload = {
        "jsonrpc": "2.0",
        "id": 101,
        "method": "tools/call",
        "params": {
            "name": "calculate_deposit_insurance",
            "arguments": {
                "accounts": [
                    {"account_id": "MCP-1", "category": "single", "balance": 400000.0, "owners": ["Alice"]}
                ]
            }
        }
    }
    r = client.post("/mcp/", json=payload, headers={"accept": "application/json, text/event-stream"})
    assert r.status_code == 200
    assert "total_insured" in r.text
    assert "250000.0" in r.text
    assert "150000.0" in r.text  # uninsured balance


def test_mcp_guidance_tool_invocation(client):
    payload = {
        "jsonrpc": "2.0",
        "id": 102,
        "method": "tools/call",
        "params": {
            "name": "get_insurance_rule_guidance",
            "arguments": {
                "category": "government"
            }
        }
    }
    r = client.post("/mcp/", json=payload, headers={"accept": "application/json, text/event-stream"})
    assert r.status_code == 200
    assert "12 CFR § 330.15" in r.text


# =====================================================================
# 10. EDGE CASES, VALIDATION, AND ADDITIONAL COMPREHENSIVE TESTS
# =====================================================================
def test_empty_accounts_portfolio():
    """Verify empty accounts portfolio returns zero balances and safe defaults."""
    res = calculate_portfolio_insurance([])
    assert res.summary.total_balance == 0.0
    assert res.summary.total_insured == 0.0
    assert res.summary.total_uninsured == 0.0
    assert res.summary.percent_insured == 100.0
    assert res.summary.is_fully_insured is True
    assert res.summary.accounts_count == 0
    assert len(res.actionable_recommendations) > 0


def test_zero_balance_account():
    """Verify $0.00 balance account is handled gracefully without division by zero."""
    acc = AccountInput(account_id="Z-1", category=AccountCategory.SINGLE, balance=0.0, owners=["Alice"])
    res = calculate_portfolio_insurance([acc])
    assert res.summary.total_balance == 0.0
    assert res.summary.total_insured == 0.0
    assert res.summary.total_uninsured == 0.0
    assert res.summary.is_fully_insured is True


def test_joint_custom_shares_percentage():
    """Verify joint account with custom percentage allocations (70% / 30%)."""
    acc = AccountInput(
        account_id="J-CP",
        category=AccountCategory.JOINT,
        balance=500000.0,
        owners=["Alice", "Bob"],
        custom_owner_shares={"Alice": 0.7, "Bob": 0.3}
    )
    res = calculate_portfolio_insurance([acc])
    # Alice share = $350k ($250k insured, $100k uninsured). Bob share = $150k (100% insured).
    assert res.summary.total_balance == 500000.0
    assert res.summary.total_insured == 400000.0
    assert res.summary.total_uninsured == 100000.0
    assert res.summary.is_fully_insured is False


def test_joint_custom_shares_dollar():
    """Verify joint account with custom dollar share allocations ($300k / $100k)."""
    acc = AccountInput(
        account_id="J-CD",
        category=AccountCategory.JOINT,
        balance=400000.0,
        owners=["Alice", "Bob"],
        custom_owner_shares={"Alice": 300000.0, "Bob": 100000.0}
    )
    res = calculate_portfolio_insurance([acc])
    # Alice has $300k interest ($250k insured, $50k uninsured). Bob has $100k interest ($100k insured).
    assert res.summary.total_balance == 400000.0
    assert res.summary.total_insured == 350000.0
    assert res.summary.total_uninsured == 50000.0


def test_retirement_over_limit():
    """Verify retirement accounts aggregating > $250k properly cap coverage."""
    ira_trad = AccountInput(account_id="R-TRAD", category=AccountCategory.RETIREMENT, balance=180000.0, owners=["Charlie"])
    ira_roth = AccountInput(account_id="R-ROTH", category=AccountCategory.RETIREMENT, balance=140000.0, owners=["Charlie"])
    res = calculate_portfolio_insurance([ira_trad, ira_roth])
    assert res.summary.total_balance == 320000.0
    assert res.summary.total_insured == 250000.0
    assert res.summary.total_uninsured == 70000.0
    assert res.summary.is_fully_insured is False


def test_multiple_trust_accounts_aggregated_grantor():
    """Verify same grantor with multiple trust accounts and overlapping beneficiaries."""
    # Alice has Trust 1 ($600k, B1, B2) and Trust 2 ($400k, B2, B3) at same bank.
    # Total unique beneficiaries = 3 -> Total coverage limit = 3 * $250k = $750k.
    # Total balance = $1,000,000 -> Insured = $750,000, Uninsured = $250,000.
    t1 = AccountInput(account_id="T-A", category=AccountCategory.TRUST, balance=600000.0, owners=["Alice"], beneficiaries=["Child 1", "Child 2"])
    t2 = AccountInput(account_id="T-B", category=AccountCategory.TRUST, balance=400000.0, owners=["Alice"], beneficiaries=["Child 2", "Child 3"])
    res = calculate_portfolio_insurance([t1, t2])
    assert res.summary.total_balance == 1000000.0
    assert res.summary.total_insured == 750000.0
    assert res.summary.total_uninsured == 250000.0


def test_pydantic_validation_negative_balance():
    """Verify that negative account balance raises validation error."""
    with pytest.raises(ValidationError):
        AccountInput(account_id="NEG-1", category=AccountCategory.SINGLE, balance=-100.0, owners=["Alice"])


def test_pydantic_validation_missing_required_fields():
    """Verify that missing account_id raises validation error."""
    with pytest.raises(ValidationError):
        AccountInput(category=AccountCategory.SINGLE, balance=100.0)


def test_fastapi_calculate_empty_portfolio(client):
    """Verify FastAPI /api/calculate handles empty list payload gracefully."""
    r = client.post("/api/calculate", json=[])
    assert r.status_code == 200
    data = r.json()
    assert data["summary"]["total_balance"] == 0.0
    assert data["summary"]["total_insured"] == 0.0
    assert data["summary"]["is_fully_insured"] is True


def test_fastapi_calculate_validation_error(client):
    """Verify FastAPI /api/calculate returns 422 on negative balance."""
    payload = [{"account_id": "ERR-1", "category": "single", "balance": -5000.0, "owners": ["Alice"]}]
    r = client.post("/api/calculate", json=payload)
    assert r.status_code == 422


def test_fastapi_guidance_all_categories(client):
    """Verify FastAPI /api/guidance without params returns overview and category listing."""
    r = client.get("/api/guidance")
    assert r.status_code == 200
    data = r.json()
    assert "available_categories" in data
    assert "single" in data["available_categories"]
    assert "trust" in data["available_categories"]


def test_fastapi_guidance_grace_period_topic(client):
    """Verify FastAPI /api/guidance with topic='death' returns 6-month grace period rules."""
    r = client.get("/api/guidance?topic=death")
    assert r.status_code == 200
    data = r.json()
    assert "death_grace_period" in data
    assert "6-month grace period" in data["death_grace_period"]


def test_fastapi_guidance_uninsured_crypto_topic(client):
    """Verify FastAPI /api/guidance with topic='crypto' returns non-deposit disclosures."""
    r = client.get("/api/guidance?topic=crypto")
    assert r.status_code == 200
    data = r.json()
    assert "uninsured_investments" in data


def test_mcp_calculate_tool_dict_input():
    """Verify calculate_deposit_insurance accepts a single dict and wraps it properly."""
    res = calculate_deposit_insurance(
        {"account_id": "DICT-1", "category": "single", "balance": 120000.0, "owners": ["Alice"]}
    )
    assert res["summary"]["total_balance"] == 120000.0
    assert res["summary"]["total_insured"] == 120000.0
    assert res["summary"]["is_fully_insured"] is True


def test_mcp_calculate_tool_validation_error_handling():
    """Verify calculate_deposit_insurance catches validation errors and returns structured error dict."""
    res = calculate_deposit_insurance(
        [{"account_id": "BAD-1", "category": "single", "balance": -999.0, "owners": ["Alice"]}]
    )
    assert "error" in res
    assert res["error"] == "Account Data Validation Error"
    assert "details" in res
