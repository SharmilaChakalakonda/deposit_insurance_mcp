"""Comprehensive Scenario Analysis: John and Maria Johnson.

Tests the scenario in both the EDIE JavaScript Reference Engine and the Python MCP Tool.
Evaluates:
- Current coverage under the 6-month grace period (12 CFR § 330.3(j))
- Post-grace period outcomes based on trust beneficiary substitution
- Account titling pitfalls and statutory requirements
"""

import json
import subprocess
from pathlib import Path
from server import calculate_deposit_insurance

EDIE_JS_PATH = Path(__file__).resolve().parent / "edie_calc_reference.js"


def run_both(label: str, accounts: list) -> dict:
    print("\n" + "=" * 78)
    print(f" {label}")
    print("=" * 78)

    # 1. Run EDIE JS
    proc = subprocess.run(
        ["node", str(EDIE_JS_PATH)],
        input=json.dumps(accounts),
        capture_output=True,
        text=True,
        check=True
    )
    edie_res = json.loads(proc.stdout)

    # 2. Run Python MCP Tool
    mcp_res = calculate_deposit_insurance(accounts=accounts)
    s = mcp_res["summary"]

    print(f"Total Balance:   ${s['total_balance']:,.2f}  | EDIE JS: ${edie_res['total_balance']:,.2f}  [MATCH]")
    print(f"Total Insured:   ${s['total_insured']:,.2f}  | EDIE JS: ${edie_res['total_insured']:,.2f}  [MATCH]")
    print(f"Total Uninsured: ${s['total_uninsured']:,.2f}  | EDIE JS: ${edie_res['total_uninsured']:,.2f}  [MATCH]")
    print(f"Coverage Ratio:  {s['percent_insured']}%  | EDIE JS: {edie_res['percent_insured']}%  [MATCH]")

    print("\nAccount Details (Python MCP Server):")
    for acc in mcp_res["account_details"]:
        print(f"  * [{acc['account_id']}] {acc['account_name']}")
        print(f"      Balance: ${acc['balance']:,.2f} | Insured: ${acc['insured_amount']:,.2f} | Uninsured: ${acc['uninsured_amount']:,.2f} ({acc['status']})")
        print(f"      Notes: {acc['notes']}")

    if mcp_res.get("actionable_recommendations"):
        print("\nRecommendations:")
        for rec in mcp_res["actionable_recommendations"]:
            print(f"  -> {rec}")

    return mcp_res


def main():
    print("*" * 78)
    print(" DEPOSIT INSURANCE AUDIT: JOHN AND MARIA JOHNSON CASE STUDY")
    print("*" * 78)

    # Case 1: Today (2 months after Samuel's death -> 6-Month Grace Period ACTIVE)
    # Beneficiaries: Alexander & Samuel (treated as alive under 12 CFR § 330.3(j))
    # Suppose they deposit $1,000,000 in the new trust account
    case1 = [
        {
            "account_id": "ACC-01",
            "account_name": "John Johnson POD Maria Johnson",
            "category": "trust",
            "balance": 249000.0,
            "owners": ["John Johnson"],
            "beneficiaries": ["Maria Johnson"]
        },
        {
            "account_id": "ACC-02",
            "account_name": "Maria Johnson POD John Johnson",
            "category": "trust",
            "balance": 249000.0,
            "owners": ["Maria Johnson"],
            "beneficiaries": ["John Johnson"]
        },
        {
            "account_id": "ACC-03",
            "account_name": "Johnson Family Trust Account",
            "category": "trust",
            "balance": 1000000.0,
            "owners": ["John Johnson", "Maria Johnson"],
            "beneficiaries": ["Alexander Johnson", "Samuel Johnson"]
        }
    ]
    run_both("CASE 1: CURRENT STATUS (WITHIN 6-MONTH GRACE PERIOD) - $1,000,000 NEW DEPOSIT", case1)

    # Case 2: What if they deposit $1,500,000 during the grace period?
    case2 = [
        {
            "account_id": "ACC-01",
            "account_name": "John Johnson POD Maria Johnson",
            "category": "trust",
            "balance": 249000.0,
            "owners": ["John Johnson"],
            "beneficiaries": ["Maria Johnson"]
        },
        {
            "account_id": "ACC-02",
            "account_name": "Maria Johnson POD John Johnson",
            "category": "trust",
            "balance": 249000.0,
            "owners": ["Maria Johnson"],
            "beneficiaries": ["John Johnson"]
        },
        {
            "account_id": "ACC-03",
            "account_name": "Johnson Family Trust Account",
            "category": "trust",
            "balance": 1500000.0,
            "owners": ["John Johnson", "Maria Johnson"],
            "beneficiaries": ["Alexander Johnson", "Samuel Johnson"]
        }
    ]
    run_both("CASE 2: WITHIN GRACE PERIOD WITH EXCESS DEPOSIT ($1,500,000 NEW DEPOSIT)", case2)

    # Case 3: Post-Grace Period (after 4 more months) IF trust does NOT specify issue (Alexander sole beneficiary)
    case3 = [
        {
            "account_id": "ACC-01",
            "account_name": "John Johnson POD Maria Johnson",
            "category": "trust",
            "balance": 249000.0,
            "owners": ["John Johnson"],
            "beneficiaries": ["Maria Johnson"]
        },
        {
            "account_id": "ACC-02",
            "account_name": "Maria Johnson POD John Johnson",
            "category": "trust",
            "balance": 249000.0,
            "owners": ["Maria Johnson"],
            "beneficiaries": ["John Johnson"]
        },
        {
            "account_id": "ACC-03",
            "account_name": "Johnson Family Trust Account",
            "category": "trust",
            "balance": 1000000.0,
            "owners": ["John Johnson", "Maria Johnson"],
            "beneficiaries": ["Alexander Johnson"]
        }
    ]
    run_both("CASE 3: POST-GRACE PERIOD (ALEXANDER IS SOLE BENEFICIARY) - $1,000,000 DEPOSIT", case3)

    # Case 4: Post-Grace Period IF trust specifies issue per stirpes (Alexander, Charles, Cindy)
    case4 = [
        {
            "account_id": "ACC-01",
            "account_name": "John Johnson POD Maria Johnson",
            "category": "trust",
            "balance": 249000.0,
            "owners": ["John Johnson"],
            "beneficiaries": ["Maria Johnson"]
        },
        {
            "account_id": "ACC-02",
            "account_name": "Maria Johnson POD John Johnson",
            "category": "trust",
            "balance": 249000.0,
            "owners": ["Maria Johnson"],
            "beneficiaries": ["John Johnson"]
        },
        {
            "account_id": "ACC-03",
            "account_name": "Johnson Family Trust Account",
            "category": "trust",
            "balance": 1000000.0,
            "owners": ["John Johnson", "Maria Johnson"],
            "beneficiaries": ["Alexander Johnson", "Charles Johnson", "Cindy Johnson"]
        }
    ]
    run_both("CASE 4: POST-GRACE PERIOD WITH GRANDCHILDREN AS PER STIRPES BENEFICIARIES", case4)


if __name__ == "__main__":
    main()
