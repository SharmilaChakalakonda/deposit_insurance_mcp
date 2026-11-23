"""Parallel Differential Testing: Official Reference Calculator (JavaScript) vs. Python FDIC MCP Tool.

Executes identical deposit account portfolios across both:
1. The FDIC Reference Calculator JavaScript reference engine (reference_calculator.js)
2. The Python FDIC MCP Server calculation engine (fdic_engine.py / server.py)

Asserts 100% mathematical parity across:
- Total Portfolio Balance
- Total Insured Deposits
- Total Uninsured Deposits
- Insurance Coverage Percentage
- Individual Account Insured / Uninsured Allocation
"""

import json
import subprocess
from pathlib import Path
import pytest
from deposit_insurance_engine import (
    AccountCategory,
    AccountInput,
    DepositType,
    Jurisdiction,
    calculate_portfolio_insurance,
)
from server import calculate_deposit_insurance

CALC_JS_PATH = Path(__file__).resolve().parent.parent / "deposit_insurance_calc_reference.js"


def run_reference_js(accounts_payload: list) -> dict:
    """Executes the reference deposit insurance calculation in JavaScript via Node.js."""
    proc = subprocess.run(
        ["node", str(CALC_JS_PATH)],
        input=json.dumps(accounts_payload),
        capture_output=True,
        text=True,
        check=True
    )
    return json.loads(proc.stdout)


def assert_parallel_parity(accounts_raw: list):
    """Runs parallel calculation on both engines and verifies identical outputs."""
    # 1. Run Reference Calculator JavaScript Engine
    ref_res = run_reference_js(accounts_raw)

    # 2. Run Python MCP Tool
    p_accs = [AccountInput(**a) for a in accounts_raw]
    py_res = calculate_portfolio_insurance(p_accs)
    py_tool_res = calculate_deposit_insurance(accounts=accounts_raw)

    # 3. Assert High-Level Totals Match Exactly
    assert pytest.approx(py_res.summary.total_balance, abs=0.01) == ref_res["total_balance"], \
        f"Total balance mismatch: Py={py_res.summary.total_balance} vs JS={ref_res['total_balance']}"

    assert pytest.approx(py_res.summary.total_insured, abs=0.01) == ref_res["total_insured"], \
        f"Total insured mismatch: Py={py_res.summary.total_insured} vs JS={ref_res['total_insured']}"

    assert pytest.approx(py_res.summary.total_uninsured, abs=0.01) == ref_res["total_uninsured"], \
        f"Total uninsured mismatch: Py={py_res.summary.total_uninsured} vs JS={ref_res['total_uninsured']}"

    assert pytest.approx(py_res.summary.percent_insured, abs=0.05) == ref_res["percent_insured"], \
        f"Coverage percent mismatch: Py={py_res.summary.percent_insured}% vs JS={ref_res['percent_insured']}%"

    # Also verify tool dict output matches
    assert pytest.approx(py_tool_res["summary"]["total_insured"], abs=0.01) == ref_res["total_insured"]

    # 4. Assert Individual Account Allocations Match
    reference_calculator_acc_map = {a["account_id"]: a for a in ref_res["accounts"]}
    for py_acc in py_res.account_details:
        reference_calculator_acc = reference_calculator_acc_map[py_acc.account_id]
        assert pytest.approx(py_acc.insured_amount, abs=0.05) == reference_calculator_acc["insured"], \
            f"Account {py_acc.account_id} insured mismatch: Py={py_acc.insured_amount} vs JS={reference_calculator_acc['insured']}"
        assert pytest.approx(py_acc.uninsured_amount, abs=0.05) == reference_calculator_acc["uninsured"], \
            f"Account {py_acc.account_id} uninsured mismatch: Py={py_acc.uninsured_amount} vs JS={reference_calculator_acc['uninsured']}"


# =====================================================================
# PARALLEL PARITY TEST CASES
# =====================================================================

def test_parallel_single_accounts():
    """Scenario 1: Single individual accounts under & over $250k limit."""
    portfolio = [
        {"account_id": "S1", "category": "single", "balance": 180000.0, "owners": ["Alice"]},
        {"account_id": "S2", "category": "single", "balance": 350000.0, "owners": ["Bob"]},
    ]
    assert_parallel_parity(portfolio)


def test_parallel_multiple_single_same_owner():
    """Scenario 2: Multiple single accounts aggregated for same depositor."""
    portfolio = [
        {"account_id": "S-CHK", "category": "single", "balance": 150000.0, "owners": ["Alice"]},
        {"account_id": "S-SAV", "category": "single", "balance": 80000.0, "owners": ["Alice"]},
        {"account_id": "S-CD", "category": "single", "balance": 100000.0, "owners": ["Alice"]},
    ]
    assert_parallel_parity(portfolio)


def test_parallel_sole_proprietorship_dba():
    """Scenario 3: Sole proprietorship DBA legally merges into single ownership."""
    portfolio = [
        {"account_id": "P1", "category": "single", "balance": 200000.0, "owners": ["Charlie"]},
        {"account_id": "DBA1", "category": "business", "balance": 120000.0, "owners": ["Charlie"], "is_sole_proprietorship": True, "business_name": "Charlie Plumbing DBA"}
    ]
    assert_parallel_parity(portfolio)


def test_parallel_joint_equal_split():
    """Scenario 4: Joint account 2 owners, $500k (100% insured)."""
    portfolio = [
        {"account_id": "J1", "category": "joint", "balance": 500000.0, "owners": ["Alice", "Bob"]}
    ]
    assert_parallel_parity(portfolio)


def test_parallel_joint_over_limit():
    """Scenario 5: Joint account 2 owners, $750k ($500k insured, $250k uninsured)."""
    portfolio = [
        {"account_id": "J2", "category": "joint", "balance": 750000.0, "owners": ["Alice", "Bob"]}
    ]
    assert_parallel_parity(portfolio)


def test_parallel_joint_cross_ownership():
    """Scenario 6: Multiple joint accounts with overlapping co-owners."""
    portfolio = [
        {"account_id": "J-AB", "category": "joint", "balance": 400000.0, "owners": ["Alice", "Bob"]},
        {"account_id": "J-AC", "category": "joint", "balance": 300000.0, "owners": ["Alice", "Charlie"]}
    ]
    assert_parallel_parity(portfolio)


def test_parallel_trust_under_limit():
    """Scenario 7: Trust account 1 grantor, 3 beneficiaries ($750k limit)."""
    portfolio = [
        {
            "account_id": "T1",
            "category": "trust",
            "balance": 650000.0,
            "owners": ["Alice"],
            "beneficiaries": ["Child A", "Child B", "Child C"]
        }
    ]
    assert_parallel_parity(portfolio)


def test_parallel_trust_beneficiary_cap_5():
    """Scenario 8: Trust account 1 grantor, 7 beneficiaries (capped at 5 = $1,250,000 max)."""
    portfolio = [
        {
            "account_id": "T2",
            "category": "trust",
            "balance": 1600000.0,
            "owners": ["Alice"],
            "beneficiaries": ["B1", "B2", "B3", "B4", "B5", "B6", "B7"]
        }
    ]
    assert_parallel_parity(portfolio)


def test_parallel_trust_two_grantors():
    """Scenario 9: Trust account 2 grantors, 4 beneficiaries ($2,000,000 limit)."""
    portfolio = [
        {
            "account_id": "T3",
            "category": "trust",
            "balance": 1800000.0,
            "owners": ["Alice", "Bob"],
            "beneficiaries": ["C1", "C2", "C3", "C4"]
        }
    ]
    assert_parallel_parity(portfolio)


def test_parallel_business_accounts():
    """Scenario 10: Corporation and LLC business accounts ($250k entity limit)."""
    portfolio = [
        {"account_id": "B1", "category": "business", "balance": 150000.0, "business_name": "Apex Holdings LLC"},
        {"account_id": "B2", "category": "business", "balance": 200000.0, "business_name": "Apex Holdings LLC"},
        {"account_id": "B3", "category": "business", "balance": 300000.0, "business_name": "Beta Enterprises Inc"}
    ]
    assert_parallel_parity(portfolio)


def test_parallel_government_in_state():
    """Scenario 11: Government in-state dual pool (demand checking $250k + time/savings CD $250k)."""
    portfolio = [
        {"account_id": "G1", "category": "government", "balance": 350000.0, "deposit_type": "checking", "jurisdiction": "in_state", "official_custodian": "Treasurer"},
        {"account_id": "G2", "category": "government", "balance": 200000.0, "deposit_type": "cd", "jurisdiction": "in_state", "official_custodian": "Treasurer"}
    ]
    assert_parallel_parity(portfolio)


def test_parallel_government_out_of_state():
    """Scenario 12: Government out-of-state single pool ($250k cap total)."""
    portfolio = [
        {"account_id": "G3", "category": "government", "balance": 200000.0, "deposit_type": "checking", "jurisdiction": "out_of_state", "official_custodian": "City Auditor"},
        {"account_id": "G4", "category": "government", "balance": 180000.0, "deposit_type": "savings", "jurisdiction": "out_of_state", "official_custodian": "City Auditor"}
    ]
    assert_parallel_parity(portfolio)


def test_parallel_retirement_accounts():
    """Scenario 13: IRA retirement accounts ($250k per participant)."""
    portfolio = [
        {"account_id": "R1", "category": "retirement", "balance": 150000.0, "owners": ["Alice"]},
        {"account_id": "R2", "category": "retirement", "balance": 150000.0, "owners": ["Alice"]}
    ]
    assert_parallel_parity(portfolio)


def test_parallel_complex_multi_category_portfolio():
    """Scenario 14: Complex 8-account portfolio mixing Single, Joint, Trust, Business, and Government."""
    portfolio = [
        {"account_id": "A1", "category": "single", "balance": 220000.0, "owners": ["David Lee"]},
        {"account_id": "A2", "category": "single", "balance": 90000.0, "owners": ["David Lee"]},
        {"account_id": "A3", "category": "joint", "balance": 550000.0, "owners": ["David Lee", "Sarah Lee"]},
        {"account_id": "A4", "category": "trust", "balance": 1400000.0, "owners": ["David Lee", "Sarah Lee"], "beneficiaries": ["Child 1", "Child 2", "Child 3"]},
        {"account_id": "A5", "category": "business", "balance": 300000.0, "business_name": "Lee Architectural Design LLC"},
        {"account_id": "A6", "category": "government", "balance": 400000.0, "deposit_type": "checking", "jurisdiction": "in_state", "official_custodian": "Town Collector"},
        {"account_id": "A7", "category": "government", "balance": 150000.0, "deposit_type": "cd", "jurisdiction": "in_state", "official_custodian": "Town Collector"},
        {"account_id": "A8", "category": "retirement", "balance": 280000.0, "owners": ["David Lee"]}
    ]
    assert_parallel_parity(portfolio)


def test_parallel_empty_portfolio():
    """Scenario 15: Edge case empty portfolio (0 accounts)."""
    assert_parallel_parity([])


def test_parallel_zero_balance_account():
    """Scenario 16: Zero balance single deposit account ($0.00)."""
    portfolio = [
        {"account_id": "Z1", "category": "single", "balance": 0.0, "owners": ["Alice"]}
    ]
    assert_parallel_parity(portfolio)


def test_parallel_multi_bank_separation():
    """Scenario 17: Multi-bank separation ensuring independent $250k limits per IDI."""
    portfolio = [
        {"account_id": "MB1", "category": "single", "balance": 300000.0, "owners": ["Alice"], "bank_name": "Bank Alpha"},
        {"account_id": "MB2", "category": "single", "balance": 300000.0, "owners": ["Alice"], "bank_name": "Bank Beta"}
    ]
    assert_parallel_parity(portfolio)


def test_parallel_joint_custom_percentages():
    """Scenario 18: Joint account with custom ownership percentage split (70% / 30%)."""
    portfolio = [
        {
            "account_id": "J-CP",
            "category": "joint",
            "balance": 500000.0,
            "owners": ["Alice", "Bob"],
            "custom_owner_shares": {"Alice": 0.7, "Bob": 0.3}
        }
    ]
    assert_parallel_parity(portfolio)


def test_parallel_joint_custom_dollar_amounts():
    """Scenario 19: Joint account with explicit dollar share allocations."""
    portfolio = [
        {
            "account_id": "J-CD",
            "category": "joint",
            "balance": 400000.0,
            "owners": ["Alice", "Bob"],
            "custom_owner_shares": {"Alice": 300000.0, "Bob": 100000.0}
        }
    ]
    assert_parallel_parity(portfolio)


def test_parallel_retirement_over_limit():
    """Scenario 20: Aggregated retirement accounts exceeding the $250k participant limit."""
    portfolio = [
        {"account_id": "R-1", "category": "retirement", "balance": 180000.0, "owners": ["Charlie"]},
        {"account_id": "R-2", "category": "retirement", "balance": 140000.0, "owners": ["Charlie"]}
    ]
    assert_parallel_parity(portfolio)


def test_parallel_multi_trust_overlapping_beneficiaries():
    """Scenario 21: Multiple trusts by same grantor with overlapping beneficiaries across accounts."""
    portfolio = [
        {"account_id": "T-A", "category": "trust", "balance": 600000.0, "owners": ["Alice"], "beneficiaries": ["Child 1", "Child 2"]},
        {"account_id": "T-B", "category": "trust", "balance": 400000.0, "owners": ["Alice"], "beneficiaries": ["Child 2", "Child 3"]}
    ]
    assert_parallel_parity(portfolio)
