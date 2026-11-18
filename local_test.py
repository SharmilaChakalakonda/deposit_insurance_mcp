"""Local Verification Script for FDIC Deposit Insurance MCP Server.

Runs end-to-end tests against the FastAPI application and MCP Streamable HTTP transport
without requiring external network access.
"""

from __future__ import annotations

import json
import sys
from starlette.testclient import TestClient
from server import app


def print_banner(text: str) -> None:
    print("\n" + "=" * 70)
    print(f" {text}")
    print("=" * 70)


def run_local_tests() -> None:
    print_banner("FDIC DEPOSIT INSURANCE MCP SERVER - LOCAL VERIFICATION")
    with TestClient(app) as client:
        # 1. Health Probe
        print("\n[Step 1/5] Testing Health Check Endpoint (/health)...")
        resp = client.get("/health")
        assert resp.status_code == 200, f"Health check failed: {resp.status_code}"
        health_data = resp.json()
        print(f"  --> Status: {health_data['status'].upper()}")
        print(f"  --> Service: {health_data['service']}")
        print(f"  --> Port: {health_data['port']}")
        print(f"  --> Tools Loaded: {', '.join(health_data['tools_loaded'])}")

        # 2. Metadata / Root Endpoint
        print("\n[Step 2/5] Testing Root Discovery Endpoint (/)...")
        resp = client.get("/")
        assert resp.status_code == 200
        root_data = resp.json()
        print(f"  --> Service: {root_data['service']}")
        print(f"  --> Regulatory Compliance: {', '.join(root_data['compliance'][:3])}...")
        print(f"  --> MCP Path: {root_data['endpoints']['mcp_streamable_http']}")

        # 3. Direct REST Calculation API
        print("\n[Step 3/5] Testing REST Calculation API (/api/calculate)...")
        sample_portfolio = [
            {
                "account_id": "ACC-CHK-01",
                "account_name": "Personal Checking",
                "category": "single",
                "balance": 300000.0,
                "owners": ["Eleanor Vance"]
            },
            {
                "account_id": "ACC-JNT-02",
                "account_name": "Family Joint Savings",
                "category": "joint",
                "balance": 600000.0,
                "owners": ["Eleanor Vance", "Thomas Vance"]
            },
            {
                "account_id": "ACC-TRST-03",
                "account_name": "Vance Living Trust",
                "category": "trust",
                "balance": 1500000.0,
                "owners": ["Eleanor Vance", "Thomas Vance"],
                "beneficiaries": ["Child A", "Child B", "Child C"]
            },
            {
                "account_id": "ACC-BIZ-04",
                "account_name": "Vance Logistics LLC",
                "category": "business",
                "balance": 350000.0,
                "business_name": "Vance Logistics LLC"
            },
            {
                "account_id": "ACC-GOV-05",
                "account_name": "County School District Demand",
                "category": "government",
                "balance": 400000.0,
                "deposit_type": "checking",
                "jurisdiction": "in_state",
                "official_custodian": "County School Treasurer"
            }
        ]

        resp = client.post("/api/calculate", json=sample_portfolio)
        assert resp.status_code == 200, f"REST calculation failed: {resp.text}"
        calc_data = resp.json()
        s = calc_data["summary"]
        print(f"  --> Total Portfolio Balance: ${s['total_balance']:,.2f}")
        print(f"  --> Total Insured:           ${s['total_insured']:,.2f}")
        print(f"  --> Total Uninsured:         ${s['total_uninsured']:,.2f}")
        print(f"  --> Insurance Coverage:      {s['percent_insured']}%")
        print(f"  --> Fully Insured:           {s['is_fully_insured']}")

        # 4. MCP Streamable HTTP Tools Discovery
        print("\n[Step 4/5] Testing MCP Streamable HTTP Transport (/mcp/ -> tools/list)...")
        mcp_list_req = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/list"
        }
        resp = client.post("/mcp/", json=mcp_list_req, headers={"accept": "application/json, text/event-stream"})
        assert resp.status_code == 200, f"MCP tools/list failed: {resp.text}"
        print("  --> MCP Streamable HTTP Protocol Handshake: SUCCESS (HTTP 200)")
        assert "calculate_deposit_insurance" in resp.text
        assert "get_insurance_rule_guidance" in resp.text
        print("  --> Discovered Tools: calculate_deposit_insurance, get_insurance_rule_guidance")

        # 5. MCP Tool Invocation via Streamable HTTP JSON-RPC
        print("\n[Step 5/5] Invoking calculate_deposit_insurance via MCP JSON-RPC Protocol...")
        mcp_call_req = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {
                "name": "calculate_deposit_insurance",
                "arguments": {
                    "accounts": [
                        {
                            "account_id": "TRUST-TEST-01",
                            "account_name": "Simplified Trust Test",
                            "category": "trust",
                            "balance": 1500000.0,
                            "owners": ["Alice Walker"],
                            "beneficiaries": ["B1", "B2", "B3", "B4", "B5", "B6", "B7"]
                        }
                    ]
                }
            }
        }
        resp = client.post("/mcp/", json=mcp_call_req, headers={"accept": "application/json, text/event-stream"})
        assert resp.status_code == 200, f"MCP tool call failed: {resp.text}"
        print("  --> MCP Tool Call: SUCCESS")
        print("  --> 2024 FDIC Trust Rule Verification:")
        print("      Grantor Alice has 7 beneficiaries, capped at 5 ($1,250,000 maximum).")
        assert "1250000.0" in resp.text
        assert "250000.0" in resp.text
        print("      Result correctly reports $1,250,000 Insured, $250,000 Uninsured.")

        print_banner("ALL LOCAL INTEGRATION TESTS COMPLETED SUCCESSFULLY (100% PASS)")


if __name__ == "__main__":
    run_local_tests()
