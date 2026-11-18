"""Visual Parallel Test Runner: EDIE (JavaScript) vs. Deposit Insurance Calculator MCP Tool (Python).

Runs differential verification tests against identical deposit portfolios and displays
a side-by-side audit report proving mathematical equivalence across all deposit insurance categories.
"""

from __future__ import annotations

import json
import subprocess
from pathlib import Path
from server import calculate_deposit_insurance

EDIE_JS_PATH = Path(__file__).resolve().parent / "edie_calc_reference.js"


def run_edie_js(accounts_payload: list) -> dict:
    proc = subprocess.run(
        ["node", str(EDIE_JS_PATH)],
        input=json.dumps(accounts_payload),
        capture_output=True,
        text=True,
        check=True
    )
    return json.loads(proc.stdout)


def format_currency(val: float) -> str:
    return f"${val:,.2f}"


def compare_scenario(name: str, accounts: list) -> bool:
    print("\n" + "-" * 75)
    print(f" SCENARIO: {name}")
    print("-" * 75)

    # 1. Run EDIE JS
    edie_res = run_edie_js(accounts)

    # 2. Run Python MCP Tool
    mcp_res = calculate_deposit_insurance(accounts=accounts)
    mcp_summary = mcp_res["summary"]

    # 3. Print Side-by-Side Comparison
    headers = f"{'Metric':<25} | {'EDIE Calculator (JS)':<22} | {'MCP Server Tool (Py)':<22} | {'Match?'}"
    print(headers)
    print("-" * 75)

    metrics = [
        ("Total Balance", edie_res["total_balance"], mcp_summary["total_balance"], True),
        ("Total Insured", edie_res["total_insured"], mcp_summary["total_insured"], True),
        ("Total Uninsured", edie_res["total_uninsured"], mcp_summary["total_uninsured"], True),
        ("Coverage Percent", f"{edie_res['percent_insured']}%", f"{mcp_summary['percent_insured']}%", False)
    ]

    all_match = True
    for label, edie_val, mcp_val, is_curr in metrics:
        if is_curr:
            match = abs(float(edie_val) - float(mcp_val)) < 0.01
            edie_str = format_currency(float(edie_val))
            mcp_str = format_currency(float(mcp_val))
        else:
            match = (edie_val == mcp_val)
            edie_str = str(edie_val)
            mcp_str = str(mcp_val)

        match_str = "[MATCH]" if match else "[MISMATCH]"
        if not match:
            all_match = False
        print(f"{label:<25} | {edie_str:<22} | {mcp_str:<22} | {match_str}")

    print("\n  --> Account Allocation Parity:")
    edie_map = {a["account_id"]: a for a in edie_res["accounts"]}
    for acc in mcp_res["account_details"]:
        e_acc = edie_map[acc["account_id"]]
        acc_match = (
            abs(acc["insured_amount"] - e_acc["insured"]) < 0.05 and
            abs(acc["uninsured_amount"] - e_acc["uninsured"]) < 0.05
        )
        if not acc_match:
            all_match = False
        status = "[MATCH]" if acc_match else "[MISMATCH]"
        print(f"      [{acc['account_id']}] Balance: {format_currency(acc['balance'])} -> Insured: {format_currency(acc['insured_amount'])} | Uninsured: {format_currency(acc['uninsured_amount'])} {status}")

    return all_match


def main() -> None:
    print("=" * 75)
    print(" PARALLEL TEST SUITE: EDIE CALCULATOR VS. MCP TOOL SERVER")
    print("=" * 75)

    scenarios = [
        (
            "1. Single Individual Exceeding $250k SMDIA",
            [
                {"account_id": "CHK-01", "category": "single", "balance": 180000.0, "owners": ["Alice"]},
                {"account_id": "SAV-02", "category": "single", "balance": 170000.0, "owners": ["Alice"]}
            ]
        ),
        (
            "2. Joint Accounts with 2 Co-Owners ($500k Limit)",
            [
                {"account_id": "JNT-01", "category": "joint", "balance": 650000.0, "owners": ["Alice", "Bob"]}
            ]
        ),
        (
            "3. Revocable Trust with Beneficiary Cap (2024 Rule: 7 Beneficiaries Capped at 5)",
            [
                {
                    "account_id": "TRST-01",
                    "category": "trust",
                    "balance": 1600000.0,
                    "owners": ["Alice"],
                    "beneficiaries": ["B1", "B2", "B3", "B4", "B5", "B6", "B7"]
                }
            ]
        ),
        (
            "4. Business Accounts (LLC Operating & Payroll Aggregated)",
            [
                {"account_id": "BIZ-01", "category": "business", "balance": 200000.0, "business_name": "Apex Holdings LLC"},
                {"account_id": "BIZ-02", "category": "business", "balance": 150000.0, "business_name": "Apex Holdings LLC"}
            ]
        ),
        (
            "5. Government In-State Dual Pools (Demand Checking vs. Time/CD)",
            [
                {"account_id": "GOV-01", "category": "government", "balance": 350000.0, "deposit_type": "checking", "jurisdiction": "in_state", "official_custodian": "Treasurer"},
                {"account_id": "GOV-02", "category": "government", "balance": 200000.0, "deposit_type": "cd", "jurisdiction": "in_state", "official_custodian": "Treasurer"}
            ]
        ),
        (
            "6. Complex Multi-Category Enterprise Portfolio",
            [
                {"account_id": "ACC-S", "category": "single", "balance": 220000.0, "owners": ["David Lee"]},
                {"account_id": "ACC-J", "category": "joint", "balance": 550000.0, "owners": ["David Lee", "Sarah Lee"]},
                {"account_id": "ACC-T", "category": "trust", "balance": 1400000.0, "owners": ["David Lee", "Sarah Lee"], "beneficiaries": ["Child 1", "Child 2", "Child 3"]},
                {"account_id": "ACC-B", "category": "business", "balance": 300000.0, "business_name": "Lee Architectural LLC"},
                {"account_id": "ACC-G", "category": "government", "balance": 400000.0, "deposit_type": "checking", "jurisdiction": "in_state", "official_custodian": "Town Collector"},
                {"account_id": "ACC-R", "category": "retirement", "balance": 280000.0, "owners": ["David Lee"]}
            ]
        )
    ]

    total_passed = 0
    for name, accs in scenarios:
        if compare_scenario(name, accs):
            total_passed += 1

    print("\n" + "=" * 75)
    print(f" PARALLEL AUDIT RESULT: {total_passed}/{len(scenarios)} SCENARIOS FULLY VERIFIED")
    if total_passed == len(scenarios):
        print(" VERDICT: 100% MATHEMATICAL PARITY CONFIRMED WITH EDIE REFERENCE CALCULATOR!")
    print("=" * 75)


if __name__ == "__main__":
    main()
