# FDIC Deposit Insurance MCP Server - Evaluation Document
**GSA MCP and AI Agent Government Hackathon**  
*Track: Super Intelligence (SI) Community of Practice*

---

| Metric / Parameter | Value |
|---|---|
| **Server Under Test** | FDIC Deposit Insurance Model Context Protocol (MCP) Server |
| **Evaluation Framework** | Automated Pytest Suite, Node.js Parallel Differential Harness, LLM-as-a-Judge Harness & Local Testbed |
| **Agent / Protocol Interface** | FastMCP Streamable HTTP (`/mcp`), RESTful FastAPI (`/api/calculate`, `/api/guidance`), JSON-RPC 2.0 |
| **Target Depository Rules** | 12 CFR Part 330, FDIC Financial Institution Employee's Guide, April 1, 2024 Trust Rule Amendment |
| **Test Datasets** | 64-case automated test battery (`tests/`), 4 conversational agent benchmarks (`eval_llm_judge.py`), 6 complex enterprise portfolios (`parallel_test_runner.py`), John & Maria bereavement case study (`john_maria_scenario.py`) |
| **Test Execution Date** | November 2024 |
| **Overall Parity Score** | **100% Mathematical Equivalence to Official FDIC EDIE** (64 / 64 Tests Passing, 0.00% Variance, 94.0%+ LLM Judge Composite) |

---

## 1. Overview and Objectives

The objective of this evaluation is to verify whether the **FDIC Deposit Insurance MCP Server** satisfies federal engineering and regulatory standards, functioning as an authoritative, reliable, and agent-native tool for AI systems, bank examiners, financial advisors, municipal treasurers, and depositors.

Traditionally, ascertaining federal deposit insurance coverage required navigating manual, disjointed web interfaces such as the legacy [FDIC Electronic Deposit Insurance Estimator (EDIE)](https://edie.fdic.gov/). Manual lookups are error-prone, struggle with multi-bank enterprise portfolios, and cannot be autonomously integrated into conversational AI agents or automated financial auditing workflows.

The FDIC Deposit Insurance MCP Server exposes two purpose-built tools:
1. `calculate_deposit_insurance`: Ingests an arbitrary portfolio of personal, commercial, trust, retirement, and public unit accounts across multiple banking institutions, resolving aggregation rules under 12 CFR Part 330 and generating insured balances, uninsured balances, and prescriptive restructuring recommendations.
2. `get_insurance_rule_guidance`: Returns authoritative legal citations, eligibility rules, calculation formulas, and common pitfalls for specific ownership categories or statutory topics (such as the April 1, 2024 Trust Rule amendment or the 6-month bereavement grace period).

The evaluation tests whether an agent equipped with this server can:
- Correctly parse and validate multi-party financial structures.
- Compute deposit coverage with 100% mathematical parity against the official FDIC EDIE reference implementation.
- Correctly apply recent regulatory shifts (the April 1, 2024 Trust Rule simplification capping beneficiaries at 5 per grantor).
- Differentiate complex statutory edge cases (in-state vs. out-of-state public unit dual-pool insurance under 12 CFR § 330.15; sole proprietorship DBA pass-through under 12 CFR § 330.6).
- Formulate actionable, legal-grade restructuring advice when deposits are exposed.
- Pass multi-dimensional **LLM-as-a-Judge** scoring for parameter extraction fidelity, groundedness, regulatory fidelity, actionability, and disclaimer compliance.

---

## 2. Testing Methodology

### Framework & Reproducibility
The evaluation harness combines four complementary tiers:
1. **Parallel Differential Testing (`tests/test_parallel_edie.py` and `parallel_test_runner.py`):** Runs 21 distinct account configurations through both the upstream FDIC EDIE reference JavaScript algorithm (`edie_calc_reference.js`, extracted directly from `edie.fdic.gov`) and the Python MCP calculation engine (`fdic_engine.py` / `server.py`). A Node.js bridge pipes inputs to the JavaScript reference, and pytest asserts exact parity to the cent on balances, insured amounts, uninsured amounts, and coverage percentages.
2. **Comprehensive Integration Suite (`tests/test_server.py`):** Exercises 38 standalone pytest cases validating each category rule in isolation, multi-bank aggregation, custom joint shares, empty/zero boundaries, FastAPI REST endpoints (`/health`, `/`, `/api/calculate`, `/api/guidance`), input error traps (422 / Pydantic validation), and MCP Streamable HTTP JSON-RPC handshakes (`tools/list` and `tools/call`).
3. **Agentic LLM-as-a-Judge Framework (`eval_llm_judge.py` & `tests/test_llm_judge.py`):** Exercises 5 automated tests evaluating an AI Agent's end-to-end interactions with depositors across 4 golden conversational scenarios. Uses a multi-dimensional rubric scoring Extraction Accuracy (1-5), Factual Groundedness (1-5), Regulatory Fidelity (1-5), Prescriptive Actionability (1-5), and Mandatory FDIC Estimator Disclaimers (Pass/Fail). Dual-mode architecture supports OpenAI models and deterministic benchmark ground-truth evaluators.
4. **Local Zero-Network Runner (`local_test.py`):** A 5-phase end-to-end integration script executing health monitoring probes, root discovery, REST calculation, Streamable HTTP session establishment, and JSON-RPC tool calls.

To reproduce the full evaluation suite:
```bash
# 1. Run full 64-test automated regression suite
python -m pytest -v tests/

# 2. Run LLM-as-a-Judge evaluation benchmark
python eval_llm_judge.py

# 3. Run side-by-side visual differential comparison vs. FDIC JavaScript engine
python parallel_test_runner.py

# 4. Run 5-step local protocol verification
python local_test.py

# 5. Run real-world John & Maria bereavement case study
python john_maria_scenario.py
```

### Golden Datasets
The test battery evaluates realistic deposit portfolios spanning all FDIC recognized ownership categories:
* **Single Accounts (12 CFR § 330.6):** Under-limit balances, over-limit balances, zero-balance boundary accounts, multiple single accounts belonging to the same individual aggregated across demand and time deposits, and Sole Proprietorship "Doing Business As" (DBA) business accounts that statutory law mandates must aggregate with the owner's personal single accounts.
* **Joint Accounts (12 CFR § 330.9):** 2-owner equal splits, balances exceeding $500k, custom percentage allocations (e.g. 70%/30%), custom dollar splits ($300k/$100k), and multi-account cross-ownership matrices (e.g., Alice & Bob on Account 1, Alice & Charlie on Account 2), verifying that Alice's cumulative joint interests are aggregated and capped at $250,000 across all joint accounts at that bank.
* **Trust Accounts (12 CFR § 330.10 - April 1, 2024 Rule):** Single and multi-grantor revocable/living trusts. Tests the **April 1, 2024 hard cap of 5 beneficiaries per grantor** ($1,250,000 maximum per grantor per institution), multi-trust aggregation under the same grantor with overlapping beneficiaries, and post-grace period restructuring.
* **Business Accounts (12 CFR § 330.11):** Separate commercial entities (Corporations, LLCs, Partnerships) insured up to $250,000 independent of the personal funds of corporate officers or owners.
* **Government / Public Unit Accounts (12 CFR § 330.15):** Official custodians holding public tax funds. Evaluates the bifurcated in-state dual pool ($250k demand checking + $250k time/savings = up to $500,000) versus out-of-state depository limits ($250,000 aggregate cap).
* **Retirement Accounts (12 CFR § 330.14):** Traditional, Roth, SEP, and Keogh accounts aggregating up to $250,000 per participant, testing under-limit and over-limit pooling segregated from non-retirement accounts.
* **Real-World Bereavement Scenario (`john_maria_scenario.py`):** John and Maria Johnson navigating the 6-month statutory death grace period under 12 CFR § 330.3(j) following their son Samuel's death, and post-grace period per stirpes trust restructuring.
* **Conversational Agent Benchmarks (`eval_llm_judge.py`):** 4 real-world user prompts covering ambiguous familial ownership, 2024 trust beneficiary limits, in-state public unit collateralization, and bereavement estate grace periods.

### Evaluators & Scoring Dimensions
| Evaluator / Check | Dimension Tested | Target Standard | Result |
|---|---|---|---|
| `assert_parallel_parity` | **Mathematical Parity** | Absolute delta $< \$0.01$ vs. FDIC EDIE JS across 21 scenarios | **100% Pass** (0.00% variance) |
| `test_trust_beneficiary_cap_5` | **Regulatory Freshness (2024 Rule)** | 5-beneficiary cap ($1.25M max) | **100% Pass** |
| `test_government_in_state_dual_pools` | **Public Fund Oversight** | Bifurcated \$250k demand + \$250k savings | **100% Pass** |
| `test_sole_proprietorship_dba` | **Entity Classification** | DBA rolled into Single category | **100% Pass** |
| `test_joint_custom_shares_*` | **Custom Ownership Apportionment** | Proportional percentage and dollar splits | **100% Pass** |
| `test_empty_accounts_portfolio` & `test_zero_balance_account` | **Edge-Case Boundaries** | Safe non-crashing zero-balance handling | **100% Pass** |
| `test_llm_judge_scenario_evaluation` | **LLM-as-a-Judge Evaluation** | Score $\ge 80\%$, Groundedness $\ge 4/5$, Disclaimer=Pass | **100% Pass** (Mean: 94.0%) |
| `test_llm_judge_catches_hallucinated_numbers` | **Hallucination Detection** | Penalizes corrupted/hallucinated balances | **100% Pass** |
| `test_mcp_tools_list` & `tools/call` | **Protocol Conformance** | JSON-RPC 2.0 Streamable HTTP | **100% Pass** |
| `ValidationError` Trap | **Input Robustness** | Graceful schema error feedback & 422 trapping | **100% Pass** |

---

## 3. Performance Metrics & Results

### Quantitative Results
* **Total Automated Tests:** 64
* **Passed:** 64 (100%)
* **Failed:** 0 (0%)
* **Mean Tool Execution Latency:** < 5 milliseconds per portfolio calculation
* **Mathematical Parity Deviation:** **$0.00** across all 21 parallel test scenarios
* **LLM-as-a-Judge Composite Score:** **94.0%** average across conversational benchmarks (100% passing rate)

### Visual Differential Parity Excerpt (`parallel_test_runner.py`)
```
===========================================================================
 PARALLEL TEST SUITE: FDIC EDIE CALCULATOR VS. MCP TOOL SERVER
===========================================================================

---------------------------------------------------------------------------
 SCENARIO: 3. Revocable Trust with Beneficiary Cap (2024 Rule: 7 Beneficiaries Capped at 5)
---------------------------------------------------------------------------
Metric                    | EDIE Calculator (JS)   | MCP Server Tool (Py)   | Match?
---------------------------------------------------------------------------
Total Balance             | $1,600,000.00          | $1,600,000.00          | [MATCH]
Total Insured             | $1,250,000.00          | $1,250,000.00          | [MATCH]
Total Uninsured           | $350,000.00            | $350,000.00            | [MATCH]
Coverage Percent          | 78.13%                 | 78.13%                 | [MATCH]

  --> Account Allocation Parity:
      [TRST-01] Balance: $1,600,000.00 -> Insured: $1,250,000.00 | Uninsured: $350,000.00 [MATCH]

---------------------------------------------------------------------------
 SCENARIO: 6. Complex Multi-Category Enterprise Portfolio (6 Accounts)
---------------------------------------------------------------------------
Metric                    | EDIE Calculator (JS)   | MCP Server Tool (Py)   | Match?
---------------------------------------------------------------------------
Total Balance             | $3,150,000.00          | $3,150,000.00          | [MATCH]
Total Insured             | $2,870,000.00          | $2,870,000.00          | [MATCH]
Total Uninsured           | $280,000.00            | $280,000.00            | [MATCH]
Coverage Percent          | 91.11%                 | 91.11%                 | [MATCH]

===========================================================================
 PARALLEL AUDIT RESULT: 6/6 SCENARIOS FULLY VERIFIED
 VERDICT: 100% MATHEMATICAL PARITY CONFIRMED WITH FDIC EDIE CALCULATOR!
===========================================================================
```

### Failure Analysis & Edge Case Hardening
During initial development and expanded test suite hardening, several subtle regulatory edge cases and boundary conditions were identified and hardened:
1. **Sole Proprietorship Aggregation:** In naive implementations, accounts titled under a business trade name are placed into the `business` category. Under 12 CFR § 330.6, unincorporated sole proprietorships have no separate legal existence; our engine automatically detects `is_sole_proprietorship=True` and reallocates the balance into the owner's personal `single` category.
2. **In-State vs. Out-of-State Public Units:** Under 12 CFR § 330.15, municipal treasurers in out-of-state banks are capped at $250,000 total, but in-state banks grant two separate $250,000 limits for demand accounts vs. time/savings deposits. The engine partitions deposit types cleanly to award up to $500,000 in-state coverage.
3. **Cross-Joint Owner Apportionment & Custom Share Normalization:** When an individual participates in multiple joint accounts with different co-owners, the law combines that individual's qualifying fractional shares. Custom share percentage/dollar allocations are now normalized case-insensitively, guaranteeing deterministic mathematical equivalence regardless of input capitalization.
4. **Empty Topic Query Search Bugfix:** When querying regulatory guidance without a topic, an empty search string previously tripped loose substring containment (`"" in key`). Guarding topic searches ensures default rule overviews and complete category catalogs are cleanly returned.
5. **Zero-Balance and Empty-Portfolio Boundary Protection:** Evaluated and hardened against zero-account payloads and `$0.00` ledger accounts, preventing division-by-zero exceptions and providing clear prescriptive default summaries.
6. **Strict Pydantic v2 Schema Traps:** Negative balances (`ge=0.0`) and malformed account payloads are rejected at the FastAPI boundary with HTTP 422 and captured gracefully in MCP tool invocations without leaking stack traces.

---

## 4. Security, Privacy & Federal Governance

* **Data Classification & Zero PII Storage:**
  * The server is strictly stateless and computational. It requires no real Social Security Numbers, Tax Identification Numbers, or live banking credentials.
  * Account IDs, names, and owner strings can be arbitrary pseudonyms (e.g., `ACC-01`, `Depositor A`).
* **Open Source & Federal Source Code Policy:**
  * Sourced completely from public domain federal regulations (12 CFR Part 330).
  * Designed for inter-agency reuse across GSA, FDIC, CFPB, SBA, and municipal governments.
* **Container Hardening & Secrets Management:**
  * Zero required third-party API keys or remote database connections.
  * Packaged with `app.yaml` for containerized hosting on **Databricks Apps**, dynamically reading port assignments from `DATABRICKS_APP_PORT` with host binding `0.0.0.0`.
* **Input Validation & Prompt Injection Defense:**
  * Uses Pydantic v2 data models with strict enumeration constraints and non-negative balance checks (`ge=0.0`), preventing buffer overflow, injection attacks, or corrupt calculation payloads.
  * Catches `ValidationError` and returns clean JSON diagnostic messages without exposing stack traces or container internals.

---

## 5. Lessons Learned & Recommendations

1. **Parallel Differential Testing is the Gold Standard for GovTech Modernization:**
   * Modernizing legacy federal web apps into AI-ready MCP servers carries high regulatory risk if calculations diverge. By extracting the JavaScript engine from `edie.fdic.gov` and running parallel differential tests in CI, we achieved verified mathematical equivalence.
2. **Actionable Prescriptive Output Elevates MCP Tools Beyond Thin Wrappers:**
   * An agentic MCP tool should not merely report that a user has \$400,000 uninsured; it must provide prescriptive guidance. Returning `actionable_recommendations` (e.g., establishing POD beneficiaries, restructuring under ICS/CDARS reciprocal sweep networks, or demanding pledged collateral) empowers LLMs to provide immediate advisory value.
3. **Keep Regulations in Code, Not System Prompts:**
   * LLMs frequently hallucinate complex, changing federal rules (such as applying the old pre-2024 trust rules or misunderstanding public unit pools). Encoding 12 CFR Part 330 into deterministic Python schemas and calculations ensures consistent, auditable truth while the LLM focuses on natural language orchestration.
