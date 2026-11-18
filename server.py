"""Deposit Insurance Calculator MCP Server - GSA Hackathon & Databricks Apps Edition.

Production-grade Model Context Protocol (MCP) server providing deposit insurance
calculations and regulatory guidance to replace manual calculator lookups.

Conforms to:
- 12 CFR Part 330 (Deposit Insurance Coverage Regulations)
- Financial Institution Employee's Guide to Deposit Insurance
- Electronic Deposit Insurance Estimator (Deposit Insurance Calculator) calculation standards
- Trust Rule Simplification (Effective April 1, 2024; 12 CFR § 330.10)
- Databricks Apps container deployment requirements
- GSA Open Source & Super Intelligence (SI) CoP standards

DISCLAIMER:
This project was developed independently using publicly available information, data,
and tools. This is NOT an official FDIC tool or official FDIC MCP server.
"""

from __future__ import annotations

import logging
import os
import sys
from typing import Any, Dict, List, Optional, Union

import uvicorn
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastmcp import FastMCP
from pydantic import ValidationError

from deposit_insurance_engine import (
    AccountCategory,
    AccountInput,
    DepositType,
    InsuranceCalculationResult,
    Jurisdiction,
    PortfolioSummary,
    TrustType,
    calculate_portfolio_insurance,
    get_rule_guidance,
)

# -----------------------------------------------------------------------------
# LOGGING CONFIGURATION
# -----------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("deposit-insurance-calculator-mcp")

# -----------------------------------------------------------------------------
# FASTMCP SERVER INITIALIZATION
# -----------------------------------------------------------------------------
mcp = FastMCP(
    name="Deposit Insurance Calculator MCP Server",
    instructions=(
        "Deposit insurance calculation and regulatory guidance server. "
        "Accurately calculates insurance coverage and uninsured balances for individual depositors, "
        "businesses, trusts, joint accounts, and government entities across insured institutions, "
        "strictly adhering to 12 CFR Part 330 and the 2024 Trust Rules."
    ),
)


# -----------------------------------------------------------------------------
# MCP TOOLS
# -----------------------------------------------------------------------------
@mcp.tool()
def calculate_deposit_insurance(
    accounts: List[AccountInput],
) -> Dict[str, Any]:
    """Calculate FDIC deposit insurance coverage and identify uninsured balances.

    Accurately estimates deposit insurance coverage for personal, business, trust,
    and government accounts at FDIC-insured institutions, mirroring the official
    FDIC Electronic Deposit Insurance Estimator (Deposit Insurance Calculator) logic and 12 CFR Part 330.

    Args:
        accounts: A list of deposit accounts to evaluate. Each account specifies:
            - account_id: Unique string identifier (e.g. 'ACC-001', 'CHK-100')
            - account_name: Descriptive label (e.g. 'Primary Checking', 'Family Trust CD')
            - category: FDIC ownership category. Must be one of:
                * 'single': Individual accounts, sole proprietorships (DBAs), single-owner decedent estates.
                * 'joint': Qualifying accounts owned by 2+ natural persons with equal withdrawal rights.
                * 'trust': Revocable (POD/ITF/Living Trust) or Irrevocable trusts.
                * 'business': Corporation, LLC, partnership, or unincorporated association accounts.
                * 'government': Public unit accounts (state, county, city, school district).
                * 'retirement': Self-directed IRAs (Traditional, Roth, SEP, SIMPLE) and Keoghs.
            - balance: Ledger balance in USD (non-negative float).
            - deposit_type: 'checking' (demand), 'savings', 'cd' (time deposit), or 'money_market'.
                (Essential for government accounts where in-state checking has a separate $250k pool).
            - bank_name: Name of the bank. Accounts at different banks are insured independently.
            - owners: List of owner/grantor names (e.g., ['Alice Smith', 'Bob Smith']).
            - beneficiaries: List of beneficiary names for trust/POD accounts.
                Under April 1, 2024 rules, capped at 5 eligible beneficiaries per grantor ($1,250,000 max).
            - is_sole_proprietorship: True if business account is a sole proprietorship (aggregates under 'single').
            - official_custodian: Title/Name of official custodian (for government accounts).
            - jurisdiction: 'in_state' or 'out_of_state' relative to bank (for government accounts).
            - custom_owner_shares: Optional custom dollar or percentage splits for joint accounts.

    Returns:
        Structured breakdown containing:
            - summary: Total balance, total insured, total uninsured, percent insured, SMDIA limit ($250,000).
            - bank_summaries: Per-depository institution coverage breakdown.
            - category_breakdowns: Aggregated insurance per statutory ownership category.
            - account_details: Insured and uninsured amounts for each individual account.
            - actionable_recommendations: Specific optimization strategies if funds are uninsured.
            - legal_disclaimer: Statutory citation and FDIC compliance disclosure.

    Examples:
        Single Account:
        >>> calculate_deposit_insurance(accounts=[{"account_id": "1", "category": "single", "balance": 300000, "owners": ["Alice"]}])

        Joint Account:
        >>> calculate_deposit_insurance(accounts=[{"account_id": "2", "category": "joint", "balance": 500000, "owners": ["Alice", "Bob"]}])

        Trust Account (2 Grantors, 3 Beneficiaries = $1.5M limit):
        >>> calculate_deposit_insurance(accounts=[{"account_id": "3", "category": "trust", "balance": 1200000, "owners": ["Alice", "Bob"], "beneficiaries": ["C1", "C2", "C3"]}])
    """
    logger.info("Executing calculate_deposit_insurance with %d account(s)", len(accounts) if isinstance(accounts, list) else 1)
    try:
        # Normalize input if single account passed
        if isinstance(accounts, dict):
            accounts = [AccountInput(**accounts)]
        elif isinstance(accounts, list):
            validated_accounts = []
            for item in accounts:
                if isinstance(item, AccountInput):
                    validated_accounts.append(item)
                elif isinstance(item, dict):
                    validated_accounts.append(AccountInput(**item))
                else:
                    raise ValueError(f"Invalid account element format: {type(item)}")
            accounts = validated_accounts
        else:
            raise ValueError(f"Expected list of AccountInput objects, received: {type(accounts)}")

        result: InsuranceCalculationResult = calculate_portfolio_insurance(accounts)
        return result.model_dump()

    except ValidationError as ve:
        logger.error("Validation error in calculate_deposit_insurance: %s", ve)
        return {
            "error": "Account Data Validation Error",
            "details": ve.errors(),
            "message": "Please ensure account parameters match the AccountInput schema: account_id, category, balance (>= 0), and appropriate owners/beneficiaries."
        }
    except Exception as exc:
        logger.error("Calculation failure: %s", exc, exc_info=True)
        return {
            "error": "Insurance Calculation Error",
            "message": str(exc),
            "recommendation": "Review account balance formats and ownership category definitions."
        }


@mcp.tool()
def get_insurance_rule_guidance(
    category: Optional[str] = None,
    topic: Optional[str] = None,
) -> Dict[str, Any]:
    """Retrieve authoritative FDIC deposit insurance rules, limits, and statutory guidance.

    Consults the FDIC Financial Institution Employee's Guide to Deposit Insurance
    and federal regulations under 12 CFR Part 330.

    Args:
        category: Optional FDIC ownership category to look up:
            - 'single': Single ownership, sole proprietorships, decedent accounts.
            - 'joint': Joint accounts, equal withdrawal rights, signature requirements.
            - 'trust': Revocable & irrevocable trusts, April 1, 2024 5-beneficiary cap rules.
            - 'business': Corporations, LLCs, partnerships, unincorporated associations.
            - 'government': Public unit accounts, official custodian rules, in-state vs out-of-state.
            - 'retirement': Self-directed IRAs, Roth IRAs, Keogh accounts.
        topic: Optional specific topic or question keyword:
            - 'trust rule change' or '2024 trust'
            - 'beneficiary cap' ($1.25M max per grantor per bank)
            - 'death grace period' or 'merger grace period' (6-month rule)
            - 'uninsured products' or 'crypto' or 'stocks' (non-deposit products)
            - 'official custodian' (public unit authority requirements)
            - 'sole proprietorship' (DBA treatment under single ownership)

    Returns:
        Structured guidance including statutory citations (12 CFR Part 330),
        coverage calculation formulas, qualification requirements, common pitfalls,
        and practical examples.
    """
    logger.info("Retrieving FDIC guidance for category='%s', topic='%s'", category, topic)
    try:
        return get_rule_guidance(category=category, topic=topic)
    except Exception as exc:
        logger.error("Failed to retrieve guidance: %s", exc)
        return {
            "error": "Guidance Lookup Error",
            "message": str(exc),
            "available_categories": ["single", "joint", "trust", "business", "government", "retirement"]
        }


# -----------------------------------------------------------------------------
# FASTAPI APPLICATION & STREAMABLE HTTP MCP TRANSPORT
# -----------------------------------------------------------------------------

# Create the FastMCP Starlette/ASGI application using Streamable HTTP transport
# stateless_http=True enables seamless compatibility with both stateful MCP clients
# and direct HTTP JSON-RPC POST invocations.
mcp_asgi_app = mcp.http_app(path="/", transport="streamable-http", stateless_http=True)

# Main FastAPI application
app = FastAPI(
    title="Deposit Insurance Calculator MCP Server",
    description=(
        "Production-grade Model Context Protocol (MCP) server providing deposit insurance "
        "calculations and regulatory guidance. Built for the GSA MCP Server & SI Agent Government "
        "Hackathon and fully compatible with Databricks Apps deployment."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=mcp_asgi_app.lifespan,
)

# Enable CORS for web and agent interfaces
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the FastMCP Streamable HTTP application at /mcp
app.mount("/mcp", mcp_asgi_app)


# -----------------------------------------------------------------------------
# REST & HEALTH CHECK ENDPOINTS (DATABRICKS APPS & CLOUD COMPLIANCE)
# -----------------------------------------------------------------------------
@app.get("/", tags=["Metadata"])
async def root_info() -> Dict[str, Any]:
    """Root metadata endpoint providing service status and API navigation."""
    port = int(os.environ.get("DATABRICKS_APP_PORT", 8000))
    return {
        "service": "Deposit Insurance Calculator MCP Server",
        "description": "Production-grade MCP server interfacing with deposit insurance regulations and Deposit Insurance Calculator calculations.",
        "disclaimer": "This is an independent open-source project built with publicly available data and tools. It is NOT an official FDIC tool or official FDIC MCP server.",
        "status": "operational",
        "version": "1.0.0",
        "compliance": [
            "12 CFR Part 330",
            "Financial Institution Employee's Guide to Deposit Insurance",
            "2024 Trust Rule Simplification",
            "GSA Open Source Guidelines",
            "Databricks Apps Specification"
        ],
        "endpoints": {
            "mcp_streamable_http": "/mcp",
            "health_check": "/health",
            "interactive_docs": "/docs",
            "rest_calculate": "/api/calculate",
            "rest_guidance": "/api/guidance"
        },
        "environment": {
            "port": port,
            "transport": "streamable-http"
        }
    }


@app.get("/health", tags=["Monitoring"])
async def health_check() -> Dict[str, Any]:
    """Health check probe endpoint for Databricks Apps, Kubernetes, and uptime monitors."""
    port = int(os.environ.get("DATABRICKS_APP_PORT", 8000))
    return {
        "status": "healthy",
        "service": "deposit-insurance-calculator-mcp",
        "port": port,
        "mcp_mounted_path": "/mcp",
        "tools_loaded": ["calculate_deposit_insurance", "get_insurance_rule_guidance"]
    }


@app.post("/api/calculate", tags=["REST API"])
async def api_calculate(accounts: List[AccountInput]) -> Dict[str, Any]:
    """Direct REST endpoint for computing deposit insurance without an MCP client."""
    result = calculate_portfolio_insurance(accounts)
    return result.model_dump()


@app.get("/api/guidance", tags=["REST API"])
async def api_guidance(category: Optional[str] = None, topic: Optional[str] = None) -> Dict[str, Any]:
    """Direct REST endpoint for querying insurance rules and statutory guidance."""
    return get_rule_guidance(category=category, topic=topic)


# -----------------------------------------------------------------------------
# SERVER RUNNER (DATABRICKS APPS & LOCAL EXECUTION)
# -----------------------------------------------------------------------------
def main() -> None:
    """Entrypoint to run the server reading dynamic port from DATABRICKS_APP_PORT."""
    # Databricks Apps injects the assigned port via DATABRICKS_APP_PORT
    port_str = os.environ.get("DATABRICKS_APP_PORT", "8000")
    try:
        port = int(port_str)
    except ValueError:
        logger.warning("Invalid DATABRICKS_APP_PORT '%s'; defaulting to 8000", port_str)
        port = 8000

    host = "0.0.0.0"
    logger.info("Starting Deposit Insurance Calculator MCP Server on %s:%d", host, port)
    logger.info("MCP Streamable HTTP transport mounted at http://%s:%d/mcp", host, port)
    logger.info("Interactive OpenAPI documentation at http://%s:%d/docs", host, port)

    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info",
        access_log=True,
    )


if __name__ == "__main__":
    main()
