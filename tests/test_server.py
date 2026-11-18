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
from starlette.testclient import TestClient
from server import app
from fdic_engine import (
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
    assert data["service"] == "fdic-deposit-insurance-mcp"
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
