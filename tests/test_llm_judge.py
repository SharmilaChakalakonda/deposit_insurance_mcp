"""Pytest integration for LLM-as-a-Judge Evaluation Tier.

Validates:
1. Agent parameter extraction and tool invocation
2. Factual groundedness (zero hallucinated numbers)
3. Regulatory fidelity (12 CFR Part 330 & 2024 Trust Rules)
4. Prescriptive restructuring recommendations
5. Mandatory FDIC statutory disclaimer compliance
"""

import pytest
from eval_llm_judge import (
    BenchmarkScenario,
    FDICAdvisorAgent,
    GOLDEN_SCENARIOS,
    JudgeEvaluationResult,
    LLMJudge,
)


@pytest.fixture(scope="module")
def judge_agent():
    return FDICAdvisorAgent()


@pytest.fixture(scope="module")
def judge():
    return LLMJudge()


@pytest.mark.parametrize("scenario", GOLDEN_SCENARIOS, ids=lambda s: s.name)
def test_llm_judge_scenario_evaluation(judge_agent, judge, scenario: BenchmarkScenario):
    """Executes the agent and verifies that the Judge awards a passing score."""
    execution = judge_agent.run(scenario)
    result: JudgeEvaluationResult = judge.evaluate(scenario, execution)

    # 1. Overall Pass assertion (minimum 80% composite quality score)
    assert result.passed is True, f"Scenario '{scenario.name}' failed judge evaluation: {result.rationale}"
    assert result.overall_score >= 80.0, f"Score {result.overall_score}% fell below 80% threshold"

    # 2. Factual Groundedness assertion (no hallucinated figures)
    assert result.groundedness >= 4, f"Factual groundedness score {result.groundedness}/5 too low"

    # 3. Extraction Accuracy assertion
    assert result.extraction_accuracy >= 4, f"Extraction score {result.extraction_accuracy}/5 too low"

    # 4. Regulatory Fidelity assertion
    assert result.regulatory_fidelity >= 4, f"Regulatory fidelity {result.regulatory_fidelity}/5 too low"

    # 5. Mandatory Disclaimer assertion
    assert result.compliance_disclaimer is True, "Mandatory FDIC disclaimer was missing from agent response"


def test_llm_judge_catches_hallucinated_numbers(judge_agent, judge):
    """Negative test: Verifies that the Judge penalizes an agent response that hallucinates numbers."""
    scenario = GOLDEN_SCENARIOS[0]
    execution = judge_agent.run(scenario)

    # Corrupt the response with hallucinated balances not in the tool output
    execution["agent_response"] = (
        "You are fully insured for $9,999,999.99 because our secret formula guarantees complete coverage."
    )

    result = judge.evaluate(scenario, execution)
    # Groundedness must drop and overall result must fail
    assert result.groundedness < 4
    assert result.passed is False
