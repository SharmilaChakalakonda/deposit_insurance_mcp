# Deposit Insurance MCP Server - Comprehensive Test Execution Report
**GSA MCP Server and AI Agent Government Hackathon**  
*Evaluation & Test Execution Date: November 23, 2026*  
*Environment: Python 3.13.5 | Pytest 9.2.0 | FastMCP Streamable HTTP | Node.js v20+*

---

## Executive Test Summary

| Metric / Parameter | Value | Status |
|---|---|:---:|
| **Total Automated Pytest Cases** | **64 Tests** | **100% Pass (64 / 64)** |
| **Mathematical Parity vs. FDIC EDIE JS** | **0.00% Variance ($0.00 Deviation)** | **Exact Cent-Level Match** |
| **LLM-as-a-Judge Agent Composite Score** | **94.0% (4 / 4 Golden Benchmarks Passing)** | **High Statutory Fidelity** |
| **Protocol Conformance** | FastMCP Streamable HTTP & JSON-RPC 2.0 | **100% Compliant** |
| **Pydantic Schema Robustness** | Strict v2 constraints (`ge=0.0`, 422 traps) | **100% Hardened** |
| **Total Execution Duration** | ~11.5 seconds | **High Performance** |

---

## Test Suites & Output Log Manifest

All raw execution logs from this test run have been preserved in this directory:

| Test Suite / Script | Output File | Scope & Coverage | Verdict |
|---|---|---|:---:|
| **Automated Pytest Suite** | [`pytest_results.txt`](file:///c:/Users/prasa/Documents/Sharmila/GSA%20Hackathon/test_outputs/pytest_results.txt) | 64 tests (21 differential, 38 integration, 5 LLM judge) | **64 / 64 PASSED** |
| **Parallel Differential Runner** | [`parallel_parity_results.txt`](file:///c:/Users/prasa/Documents/Sharmila/GSA%20Hackathon/test_outputs/parallel_parity_results.txt) | 6 complex enterprise portfolios vs. FDIC EDIE JS | **100% MATCH** |
| **LLM-as-a-Judge Harness** | [`llm_judge_results.txt`](file:///c:/Users/prasa/Documents/Sharmila/GSA%20Hackathon/test_outputs/llm_judge_results.txt) | 5-dimension rubric across 4 golden conversational scenarios | **94.0% COMPOSITE** |
| **Local Protocol Verifier** | [`local_verification_results.txt`](file:///c:/Users/prasa/Documents/Sharmila/GSA%20Hackathon/test_outputs/local_verification_results.txt) | 5-phase zero-network probe: health, discovery, REST, MCP | **100% PASS** |
| **Bereavement Case Study** | [`john_maria_scenario_results.txt`](file:///c:/Users/prasa/Documents/Sharmila/GSA%20Hackathon/test_outputs/john_maria_scenario_results.txt) | 4-scenario real-world audit: 6-month grace period & per stirpes | **100% MATCH** |

---

## Detailed Test Breakdown

### 1. Automated Pytest Battery (64 Tests) &mdash; [`pytest_results.txt`](file:///c:/Users/prasa/Documents/Sharmila/GSA%20Hackathon/test_outputs/pytest_results.txt)
* **LLM-as-a-Judge Suite (`tests/test_llm_judge.py` - 5 Tests):**
  * `test_llm_judge_scenario_evaluation[1. Bob & Alice Family + Sole Proprietorship DBA]`: Verified DBA single rollover, joint excess flagging, and statutory citations.
  * `test_llm_judge_scenario_evaluation[2. 2024 Trust Rule 5-Beneficiary Cap Stress Test]`: Verified 5-beneficiary cap at $1,250,000 under April 1, 2024 rule.
  * `test_llm_judge_scenario_evaluation[3. Municipal Treasurer Public Unit Dual-Pool]`: Verified bifurcated in-state demand checking vs time CD pools and collateralization advice.
  * `test_llm_judge_scenario_evaluation[4. Bereavement 6-Month Statutory Grace Period]`: Verified 12 CFR § 330.3 grace period advice following depositor death.
  * `test_llm_judge_catches_hallucinated_numbers`: Negative test confirming the Judge penalizes and fails any agent response that hallucinates balance numbers.
* **Parallel Differential Parity Suite (`tests/test_parallel_edie.py` - 21 Tests):**
  * Evaluated single accounts, joint accounts, trust accounts, business entities, government custodians, retirement IRAs, multi-bank portfolios, zero balances, custom percentage/dollar joint splits, and overlapping multi-trust accounts against upstream `edie_calc_reference.js` with $0.00 variance.
* **Integration & Validation Suite (`tests/test_server.py` - 38 Tests):**
  * Evaluated FastAPI REST endpoints (`/health`, `/`, `/api/calculate`, `/api/guidance`), FastMCP JSON-RPC transport (`tools/list`, `tools/call`), Pydantic negative balance rejections (HTTP 422), and empty-portfolio boundary conditions.

### 2. Parallel Differential Parity Excerpt &mdash; [`parallel_parity_results.txt`](file:///c:/Users/prasa/Documents/Sharmila/GSA%20Hackathon/test_outputs/parallel_parity_results.txt)
```
===========================================================================
 PARALLEL TEST SUITE: FDIC EDIE CALCULATOR VS. MCP TOOL SERVER
===========================================================================
 SCENARIO 1: Single Individual Exceeding $250k SMDIA        -> [MATCH]
 SCENARIO 2: Joint Accounts with 2 Co-Owners ($500k Limit)  -> [MATCH]
 SCENARIO 3: Revocable Trust with Beneficiary Cap (2024)    -> [MATCH]
 SCENARIO 4: Business Accounts (LLC Operating & Payroll)    -> [MATCH]
 SCENARIO 5: Government In-State Dual Pools                 -> [MATCH]
 SCENARIO 6: Complex Multi-Category Enterprise Portfolio    -> [MATCH]
===========================================================================
 VERDICT: 100% MATHEMATICAL PARITY CONFIRMED WITH FDIC EDIE CALCULATOR!
===========================================================================
```

### 3. LLM-as-a-Judge Audit Excerpt &mdash; [`llm_judge_results.txt`](file:///c:/Users/prasa/Documents/Sharmila/GSA%20Hackathon/test_outputs/llm_judge_results.txt)
```
================================================================================
 LLM-AS-A-JUDGE AUDIT SUMMARY
================================================================================
Scenario                                   | Extract | Ground  | Reg   | Disc   | Score   | Result
--------------------------------------------------------------------------------
1. Bob & Alice Family + Sole Proprietorshi |     5/5 |     5/5 |   4/5 | Yes    |  94.0% | [PASS]
2. 2024 Trust Rule 5-Beneficiary Cap Stres |     5/5 |     5/5 |   4/5 | Yes    |  94.0% | [PASS]
3. Municipal Treasurer Public Unit Dual-Po |     5/5 |     5/5 |   4/5 | Yes    |  94.0% | [PASS]
4. Bereavement 6-Month Statutory Grace Per |     5/5 |     5/5 |   4/5 | Yes    |  94.0% | [PASS]
================================================================================
 OVERALL VERDICT: ALL SCENARIOS PASSED (Mean Composite Score: 94.0%)
================================================================================
```

### 4. Local Zero-Network Verification &mdash; [`local_verification_results.txt`](file:///c:/Users/prasa/Documents/Sharmila/GSA%20Hackathon/test_outputs/local_verification_results.txt)
* **[Step 1/5] Health Check Probe (`/health`):** HTTP 200 `status: healthy`, tools loaded: `calculate_deposit_insurance`, `get_insurance_rule_guidance`.
* **[Step 2/5] Root Discovery (`/`):** HTTP 200, 12 CFR Part 330 compliance metadata.
* **[Step 3/5] REST Calculation (`/api/calculate`):** Correctly calculated $3.15M portfolio ($2.75M insured, $400k uninsured).
* **[Step 4/5] MCP Streamable HTTP Handshake (`/mcp/`):** Successfully negotiated session and listed tools via JSON-RPC 2.0.
* **[Step 5/5] MCP Tool Invocation (`calculate_deposit_insurance`):** Successfully invoked calculation via JSON-RPC, verifying the 2024 Trust Rule 5-beneficiary cap.

### 5. Bereavement Case Study &mdash; [`john_maria_scenario_results.txt`](file:///c:/Users/prasa/Documents/Sharmila/GSA%20Hackathon/test_outputs/john_maria_scenario_results.txt)
* **Case 1 (Within 6-Month Grace Period, $1.0M deposit):** 100% insured ($1,498,000 total balance).
* **Case 2 (Within Grace Period with Excess Deposit, $1.5M deposit):** $1,500,000 insured, $497,999.99 uninsured; restructuring advice generated.
* **Case 3 (Post-Grace Period, Alexander Sole Beneficiary):** Coverage drops to $1,000,000 insured ($498,000 uninsured).
* **Case 4 (Post-Grace Period with Grandchildren as Per Stirpes Beneficiaries):** Restructuring restores 100% coverage ($1,498,000 insured).
