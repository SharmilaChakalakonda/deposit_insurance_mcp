"""Deposit Insurance Calculation Engine and Rules Guidance.

DISCLAIMER:
This calculation engine is an independent open-source project built using publicly available regulations,
data, and calculation methods. It is NOT created, endorsed, certified, or sponsored by the FDIC.

Sourced from public regulations and standards:
- 12 CFR Part 330 (Deposit Insurance Coverage Regulations)
- FDIC Financial Institution Employee's Guide to Deposit Insurance
- Electronic Deposit Insurance Estimator (EDIE) calculation reference standards
- FDIC 2024 Trust Rule Simplification (Effective April 1, 2024; 12 CFR § 330.10)
"""

from __future__ import annotations

import math
from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator

# Standard Maximum Deposit Insurance Amount
SMDIA_DEFAULT: float = 250000.0


class AccountCategory(str, Enum):
    """FDIC Recognized Ownership Categories (12 CFR Part 330)."""
    SINGLE = "single"
    JOINT = "joint"
    TRUST = "trust"
    BUSINESS = "business"
    GOVERNMENT = "government"
    RETIREMENT = "retirement"


class DepositType(str, Enum):
    """Deposit product classification."""
    CHECKING = "checking"        # Demand deposit / transaction account
    SAVINGS = "savings"          # Savings account / MMDA
    CD = "cd"                    # Time deposit / Certificate of Deposit
    MONEY_MARKET = "money_market"  # Money Market Deposit Account (MMDA)


class TrustType(str, Enum):
    """Trust classification (unified under April 1, 2024 simplified rule)."""
    REVOCABLE = "revocable"      # Payable on Death (POD), In Trust For (ITF), Living Trust
    IRREVOCABLE = "irrevocable"  # Irrevocable Trust


class Jurisdiction(str, Enum):
    """Public Unit / Government entity jurisdiction relative to bank."""
    IN_STATE = "in_state"        # Same state as bank (IDI)
    OUT_OF_STATE = "out_of_state"  # Outside state of bank (IDI)


class AccountInput(BaseModel):
    """Standard input schema for a bank deposit account for FDIC insurance evaluation."""
    account_id: str = Field(
        ...,
        description="Unique identifier for the account (e.g., 'ACC-001', 'CHK-1092')",
        examples=["ACC-101", "JOINT-SAV-02"]
    )
    account_name: Optional[str] = Field(
        default="Deposit Account",
        description="Descriptive account name or label (e.g., 'Primary Checking', 'Family Living Trust')",
        examples=["Primary Checking", "Emergency Savings", "Smith Revocable Trust"]
    )
    category: AccountCategory = Field(
        ...,
        description="FDIC ownership category: 'single', 'joint', 'trust', 'business', 'government', or 'retirement'",
        examples=["single", "joint", "trust"]
    )
    balance: float = Field(
        ...,
        ge=0.0,
        description="Current account ledger balance in US Dollars (USD). Must be non-negative.",
        examples=[150000.0, 320000.0]
    )
    deposit_type: DepositType = Field(
        default=DepositType.CHECKING,
        description="Deposit product type. Critical for government accounts where in-state demand deposits are insured separately from time/savings deposits.",
        examples=["checking", "savings", "cd"]
    )
    bank_name: str = Field(
        default="Primary FDIC-Insured Institution",
        description="Name or charter ID of the insured depository institution. Accounts at separate banks are insured independently.",
        examples=["First National Bank", "City Commercial Bank"]
    )
    owners: List[str] = Field(
        default_factory=list,
        description="Names of individual account owners or trust grantors. For joint accounts, at least two co-owners must be specified.",
        examples=[["Alice Smith"], ["Alice Smith", "Bob Smith"]]
    )
    beneficiaries: List[str] = Field(
        default_factory=list,
        description="List of named eligible beneficiaries for trust / POD accounts. Under 2024 rules, capped at 5 beneficiaries per grantor.",
        examples=[["Charlie Smith", "Diana Smith"]]
    )
    trust_type: Optional[TrustType] = Field(
        default=TrustType.REVOCABLE,
        description="Classification for trust accounts: 'revocable' or 'irrevocable'. Follows unified April 1, 2024 rules.",
        examples=["revocable"]
    )
    business_name: Optional[str] = Field(
        default=None,
        description="Legal name of the corporation, LLC, partnership, or unincorporated association (for business accounts).",
        examples=["Acme Technologies LLC", "Oakwood HOA"]
    )
    is_sole_proprietorship: bool = Field(
        default=False,
        description="Set to true if business account is a sole proprietorship (DBA). By FDIC law, sole proprietorships are insured as Single Accounts of the owner.",
        examples=[False]
    )
    official_custodian: Optional[str] = Field(
        default=None,
        description="Title/Name of the official custodian with plenary authority over public funds (for government accounts).",
        examples=["County Treasurer", "City Finance Director"]
    )
    public_unit_name: Optional[str] = Field(
        default=None,
        description="Name of the government public unit (e.g., 'Fairfax County', 'State of Ohio').",
        examples=["Travis County", "City of Austin"]
    )
    jurisdiction: Jurisdiction = Field(
        default=Jurisdiction.IN_STATE,
        description="Jurisdiction of the public unit relative to the bank: 'in_state' or 'out_of_state'.",
        examples=["in_state"]
    )
    custom_owner_shares: Optional[Dict[str, float]] = Field(
        default=None,
        description="Optional explicit dollar or percentage shares for joint accounts. If omitted, co-owners are presumed equal.",
        examples=[{"Alice Smith": 0.5, "Bob Smith": 0.5}]
    )

    @field_validator("balance")
    @classmethod
    def round_balance(cls, v: float) -> float:
        return float(Decimal(str(v)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

    @model_validator(mode="after")
    def validate_category_requirements(self) -> AccountInput:
        # Default owners if missing
        if self.category == AccountCategory.SINGLE:
            if not self.owners:
                self.owners = ["Primary Account Holder"]
        elif self.category == AccountCategory.JOINT:
            if not self.owners:
                self.owners = ["Co-Owner 1", "Co-Owner 2"]
            elif len(self.owners) < 2:
                # Joint account requires at least two natural persons
                self.owners.append(f"{self.owners[0]} (Co-Owner)")
        elif self.category == AccountCategory.TRUST:
            if not self.owners:
                self.owners = ["Trust Grantor"]
            if not self.beneficiaries:
                # If no beneficiaries listed for trust, warn/default to 1 eligible beneficiary
                self.beneficiaries = ["Designated Beneficiary"]
        elif self.category == AccountCategory.BUSINESS:
            if not self.business_name:
                self.business_name = self.account_name or "Commercial Entity"
        elif self.category == AccountCategory.GOVERNMENT:
            if not self.official_custodian:
                self.official_custodian = "Designated Official Custodian"
            if not self.public_unit_name:
                self.public_unit_name = "Public Unit Body"
        elif self.category == AccountCategory.RETIREMENT:
            if not self.owners:
                self.owners = ["Retirement Account Participant"]
        return self


# Output Schemas
class AccountInsuranceDetail(BaseModel):
    """Detailed insurance result for a single deposit account."""
    account_id: str
    account_name: str
    category: str
    bank_name: str
    balance: float
    insured_amount: float
    uninsured_amount: float
    status: str = Field(description="'Fully Insured', 'Partially Insured', or 'Uninsured'")
    notes: str


class CategoryBreakdown(BaseModel):
    """Summary of coverage within a specific FDIC ownership category."""
    category: str
    balance: float
    insured: float
    uninsured: float
    statutory_reference: str
    rule_summary: str
    owner_details: List[Dict[str, Any]] = Field(default_factory=list)


class BankInsuranceSummary(BaseModel):
    """Insurance summary for an individual Insured Depository Institution (IDI)."""
    bank_name: str
    total_balance: float
    insured_balance: float
    uninsured_balance: float
    percent_insured: float
    categories: Dict[str, float]


class PortfolioSummary(BaseModel):
    """High-level summary of total portfolio deposit insurance."""
    total_balance: float
    total_insured: float
    total_uninsured: float
    percent_insured: float
    is_fully_insured: bool
    smdia_limit: float = SMDIA_DEFAULT
    accounts_count: int
    institutions_count: int


class InsuranceCalculationResult(BaseModel):
    """Comprehensive output payload returned by the deposit insurance calculator."""
    summary: PortfolioSummary
    bank_summaries: Dict[str, BankInsuranceSummary]
    category_breakdowns: List[CategoryBreakdown]
    account_details: List[AccountInsuranceDetail]
    actionable_recommendations: List[str]
    legal_disclaimer: str


# =====================================================================
# CALCULATION ENGINE
# =====================================================================

def calculate_portfolio_insurance(
    accounts: List[AccountInput],
    smdia: float = SMDIA_DEFAULT
) -> InsuranceCalculationResult:
    """
    Executes the FDIC Deposit Insurance Calculator-compliant deposit insurance calculation algorithm.
    Evaluates accounts per insured institution, per ownership category, and per depositor/custodian.
    """
    if not accounts:
        return InsuranceCalculationResult(
            summary=PortfolioSummary(
                total_balance=0.0,
                total_insured=0.0,
                total_uninsured=0.0,
                percent_insured=100.0,
                is_fully_insured=True,
                smdia_limit=smdia,
                accounts_count=0,
                institutions_count=0
            ),
            bank_summaries={},
            category_breakdowns=[],
            account_details=[],
            actionable_recommendations=["No accounts provided for analysis."],
            legal_disclaimer=_get_fdic_disclaimer()
        )

    # Group accounts by bank
    banks: Dict[str, List[AccountInput]] = defaultdict(list)
    for acc in accounts:
        banks[acc.bank_name].append(acc)

    account_details: List[AccountInsuranceDetail] = []
    category_breakdowns_map: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
        "balance": 0.0,
        "insured": 0.0,
        "uninsured": 0.0,
        "owners": defaultdict(lambda: {"balance": 0.0, "insured": 0.0, "uninsured": 0.0})
    })

    bank_summaries: Dict[str, BankInsuranceSummary] = {}
    recommendations: List[str] = []

    # Process each bank independently
    for bank_name, bank_accounts in banks.items():
        bank_total = sum(a.balance for a in bank_accounts)
        bank_insured = 0.0

        # Partition accounts by category (treating sole proprietorship business as Single)
        single_accounts: List[AccountInput] = []
        joint_accounts: List[AccountInput] = []
        trust_accounts: List[AccountInput] = []
        business_accounts: List[AccountInput] = []
        government_accounts: List[AccountInput] = []
        retirement_accounts: List[AccountInput] = []

        for acc in bank_accounts:
            if acc.category == AccountCategory.BUSINESS and acc.is_sole_proprietorship:
                # Under 12 CFR § 330.6, sole proprietorships are single accounts of the sole owner
                single_accounts.append(acc)
            elif acc.category == AccountCategory.SINGLE:
                single_accounts.append(acc)
            elif acc.category == AccountCategory.JOINT:
                joint_accounts.append(acc)
            elif acc.category == AccountCategory.TRUST:
                trust_accounts.append(acc)
            elif acc.category == AccountCategory.BUSINESS:
                business_accounts.append(acc)
            elif acc.category == AccountCategory.GOVERNMENT:
                government_accounts.append(acc)
            elif acc.category == AccountCategory.RETIREMENT:
                retirement_accounts.append(acc)

        # -------------------------------------------------------------
        # 1. SINGLE ACCOUNTS (12 CFR § 330.6)
        # -------------------------------------------------------------
        if single_accounts:
            owner_groups: Dict[str, List[AccountInput]] = defaultdict(list)
            for acc in single_accounts:
                owner = acc.owners[0].strip().title() if acc.owners else "Account Owner"
                owner_groups[owner].append(acc)

            for owner, owner_accs in owner_groups.items():
                owner_bal = sum(a.balance for a in owner_accs)
                owner_ins = min(owner_bal, smdia)
                owner_unins = max(0.0, owner_bal - smdia)
                ratio = (owner_ins / owner_bal) if owner_bal > 0 else 1.0

                category_breakdowns_map["single"]["balance"] += owner_bal
                category_breakdowns_map["single"]["insured"] += owner_ins
                category_breakdowns_map["single"]["uninsured"] += owner_unins
                category_breakdowns_map["single"]["owners"][owner]["balance"] += owner_bal
                category_breakdowns_map["single"]["owners"][owner]["insured"] += owner_ins
                category_breakdowns_map["single"]["owners"][owner]["uninsured"] += owner_unins

                bank_insured += owner_ins

                for acc in owner_accs:
                    acc_ins = round(acc.balance * ratio, 2)
                    acc_unins = round(acc.balance - acc_ins, 2)
                    status = "Fully Insured" if acc_unins == 0 else ("Partially Insured" if acc_ins > 0 else "Uninsured")
                    sole_prop_note = " (Sole Proprietorship DBA aggregated under single ownership)" if acc.is_sole_proprietorship else ""
                    note = f"Owner: {owner}. Aggregated single balance: ${owner_bal:,.2f} vs $250k SMDIA limit.{sole_prop_note}"
                    account_details.append(AccountInsuranceDetail(
                        account_id=acc.account_id,
                        account_name=acc.account_name or "Single Account",
                        category=acc.category.value,
                        bank_name=bank_name,
                        balance=acc.balance,
                        insured_amount=acc_ins,
                        uninsured_amount=acc_unins,
                        status=status,
                        notes=note
                    ))

                if owner_unins > 0:
                    recommendations.append(
                        f"Depositor '{owner}' has ${owner_unins:,.2f} in uninsured funds across single accounts at '{bank_name}'. "
                        f"Consider establishing a Payable on Death (POD) beneficiary designation, creating a qualifying joint account, "
                        f"or depositing the excess funds into a separate FDIC-insured depository institution."
                    )

        # -------------------------------------------------------------
        # 2. JOINT ACCOUNTS (12 CFR § 330.9)
        # -------------------------------------------------------------
        if joint_accounts:
            # Calculate each co-owner's qualifying share across all joint accounts at this bank
            co_owner_shares: Dict[str, float] = defaultdict(float)
            account_owner_shares: Dict[str, Dict[str, float]] = {}

            for acc in joint_accounts:
                norm_owners = [o.strip().title() for o in acc.owners]
                account_owner_shares[acc.account_id] = {}
                n_owners = len(norm_owners)
                norm_custom_shares = {k.strip().title(): v for k, v in acc.custom_owner_shares.items()} if acc.custom_owner_shares else {}

                for owner in norm_owners:
                    if norm_custom_shares and owner in norm_custom_shares:
                        share_val = norm_custom_shares[owner]
                        # Check if share is fraction or dollar amount
                        if share_val <= 1.0:
                            share_amount = acc.balance * share_val
                        else:
                            share_amount = share_val
                    else:
                        share_amount = acc.balance / n_owners

                    account_owner_shares[acc.account_id][owner] = share_amount
                    co_owner_shares[owner] += share_amount

            # Determine each co-owner's insured and uninsured joint interest
            co_owner_coverage_ratio: Dict[str, float] = {}
            for owner, total_interest in co_owner_shares.items():
                ins_interest = min(total_interest, smdia)
                unins_interest = max(0.0, total_interest - smdia)
                ratio = (ins_interest / total_interest) if total_interest > 0 else 1.0
                co_owner_coverage_ratio[owner] = ratio

                category_breakdowns_map["joint"]["balance"] += total_interest
                category_breakdowns_map["joint"]["insured"] += ins_interest
                category_breakdowns_map["joint"]["uninsured"] += unins_interest
                category_breakdowns_map["joint"]["owners"][owner]["balance"] += total_interest
                category_breakdowns_map["joint"]["owners"][owner]["insured"] += ins_interest
                category_breakdowns_map["joint"]["owners"][owner]["uninsured"] += unins_interest

                if unins_interest > 0:
                    recommendations.append(
                        f"Co-owner '{owner}' has ${unins_interest:,.2f} in excess of the $250,000 joint ownership limit at '{bank_name}'. "
                        f"All joint interests for an individual at the same bank are aggregated together regardless of co-owner combinations."
                    )

            # Allocate back to accounts
            for acc in joint_accounts:
                acc_ins = 0.0
                shares_summary = []
                for owner, share in account_owner_shares[acc.account_id].items():
                    owner_ins_share = share * co_owner_coverage_ratio[owner]
                    acc_ins += owner_ins_share
                    shares_summary.append(f"{owner}: ${share:,.2f} (insured ${owner_ins_share:,.2f})")

                acc_ins = round(acc_ins, 2)
                acc_unins = round(acc.balance - acc_ins, 2)
                bank_insured += acc_ins
                status = "Fully Insured" if acc_unins == 0 else ("Partially Insured" if acc_ins > 0 else "Uninsured")
                note = f"Joint co-owners: {', '.join(shares_summary)}."

                account_details.append(AccountInsuranceDetail(
                    account_id=acc.account_id,
                    account_name=acc.account_name or "Joint Account",
                    category=acc.category.value,
                    bank_name=bank_name,
                    balance=acc.balance,
                    insured_amount=acc_ins,
                    uninsured_amount=acc_unins,
                    status=status,
                    notes=note
                ))

        # -------------------------------------------------------------
        # 3. TRUST ACCOUNTS (12 CFR § 330.10 - April 1, 2024 Rule)
        # -------------------------------------------------------------
        if trust_accounts:
            # Under 12 CFR § 330.10(a), a depositor's interests in all trust accounts at the IDI
            # are aggregated per grantor. For each grantor, coverage is $250k per unique eligible
            # beneficiary across all trust accounts at the IDI, up to a maximum of 5 beneficiaries ($1.25M max).
            grantor_shares: Dict[str, float] = defaultdict(float)
            grantor_beneficiaries: Dict[str, set] = defaultdict(set)
            account_grantor_shares: Dict[str, Dict[str, float]] = {}

            for acc in trust_accounts:
                norm_grantors = [g.strip().title() for g in acc.owners] or ["Trust Grantor"]
                account_grantor_shares[acc.account_id] = {}
                n_grantors = len(norm_grantors)
                share_amount = acc.balance / n_grantors

                for grantor in norm_grantors:
                    account_grantor_shares[acc.account_id][grantor] = share_amount
                    grantor_shares[grantor] += share_amount
                    for b in acc.beneficiaries:
                        grantor_beneficiaries[grantor].add(b.strip().title())

            grantor_coverage_ratio: Dict[str, float] = {}
            for grantor, total_trust_bal in grantor_shares.items():
                b_set = grantor_beneficiaries[grantor]
                n_beneficiaries = len(b_set)
                counted_beneficiaries = min(max(1, n_beneficiaries), 5)
                grantor_limit = counted_beneficiaries * smdia

                grantor_ins = min(total_trust_bal, grantor_limit)
                grantor_unins = max(0.0, total_trust_bal - grantor_limit)
                ratio = (grantor_ins / total_trust_bal) if total_trust_bal > 0 else 1.0
                grantor_coverage_ratio[grantor] = ratio

                category_breakdowns_map["trust"]["balance"] += total_trust_bal
                category_breakdowns_map["trust"]["insured"] += grantor_ins
                category_breakdowns_map["trust"]["uninsured"] += grantor_unins

                category_breakdowns_map["trust"]["owners"][grantor]["balance"] += total_trust_bal
                category_breakdowns_map["trust"]["owners"][grantor]["insured"] += grantor_ins
                category_breakdowns_map["trust"]["owners"][grantor]["uninsured"] += grantor_unins

                if grantor_unins > 0:
                    recommendations.append(
                        f"Grantor '{grantor}' has ${grantor_unins:,.2f} in excess trust deposits at '{bank_name}'. "
                        f"Under 12 CFR § 330.10, all trust accounts for a grantor are aggregated and capped at "
                        f"5 eligible beneficiaries (${grantor_limit:,.2f} limit). To obtain full coverage, consider "
                        f"depositing excess funds into a separate FDIC-insured institution."
                    )

            # Allocate back to individual trust accounts
            for acc in trust_accounts:
                acc_ins = 0.0
                shares_summary = []
                for grantor, share in account_grantor_shares[acc.account_id].items():
                    grantor_ins_share = share * grantor_coverage_ratio[grantor]
                    acc_ins += grantor_ins_share
                    shares_summary.append(f"{grantor}: ${share:,.2f} (insured ${grantor_ins_share:,.2f})")

                acc_ins = round(acc_ins, 2)
                acc_unins = round(acc.balance - acc_ins, 2)
                bank_insured += acc_ins
                status = "Fully Insured" if acc_unins == 0 else ("Partially Insured" if acc_ins > 0 else "Uninsured")
                b_names = ", ".join(list(acc.beneficiaries)[:5])
                note = f"Grantor(s): {', '.join(shares_summary)}. Beneficiaries: {b_names} (12 CFR § 330.10)."

                account_details.append(AccountInsuranceDetail(
                    account_id=acc.account_id,
                    account_name=acc.account_name or "Trust Account",
                    category=acc.category.value,
                    bank_name=bank_name,
                    balance=acc.balance,
                    insured_amount=acc_ins,
                    uninsured_amount=acc_unins,
                    status=status,
                    notes=note
                ))

        # -------------------------------------------------------------
        # 4. BUSINESS ACCOUNTS (12 CFR § 330.11)
        # -------------------------------------------------------------
        if business_accounts:
            entity_groups: Dict[str, List[AccountInput]] = defaultdict(list)
            for acc in business_accounts:
                entity = (acc.business_name or acc.account_name or "Business Entity").strip()
                entity_groups[entity].append(acc)

            for entity, e_accs in entity_groups.items():
                e_bal = sum(a.balance for a in e_accs)
                e_ins = min(e_bal, smdia)
                e_unins = max(0.0, e_bal - smdia)
                ratio = (e_ins / e_bal) if e_bal > 0 else 1.0

                category_breakdowns_map["business"]["balance"] += e_bal
                category_breakdowns_map["business"]["insured"] += e_ins
                category_breakdowns_map["business"]["uninsured"] += e_unins
                category_breakdowns_map["business"]["owners"][entity]["balance"] += e_bal
                category_breakdowns_map["business"]["owners"][entity]["insured"] += e_ins
                category_breakdowns_map["business"]["owners"][entity]["uninsured"] += e_unins

                bank_insured += e_ins

                for acc in e_accs:
                    acc_ins = round(acc.balance * ratio, 2)
                    acc_unins = round(acc.balance - acc_ins, 2)
                    status = "Fully Insured" if acc_unins == 0 else ("Partially Insured" if acc_ins > 0 else "Uninsured")
                    note = f"Commercial Entity: {entity}. Insured up to $250k separate from personal accounts of officers/owners (12 CFR § 330.11)."
                    account_details.append(AccountInsuranceDetail(
                        account_id=acc.account_id,
                        account_name=acc.account_name or "Business Account",
                        category=acc.category.value,
                        bank_name=bank_name,
                        balance=acc.balance,
                        insured_amount=acc_ins,
                        uninsured_amount=acc_unins,
                        status=status,
                        notes=note
                    ))

                if e_unins > 0:
                    recommendations.append(
                        f"Business entity '{entity}' has ${e_unins:,.2f} in uninsured funds at '{bank_name}'. "
                        f"All deposits of a corporation, partnership, or LLC at the same institution are combined and insured up to $250,000 total. "
                        f"Consider using an Insured Cash Sweep (ICS) / Certificate of Deposit Account Registry Service (CDARS) network or distributing across multiple institutions."
                    )

        # -------------------------------------------------------------
        # 5. GOVERNMENT / PUBLIC UNIT ACCOUNTS (12 CFR § 330.15)
        # -------------------------------------------------------------
        if government_accounts:
            custodian_groups: Dict[str, List[AccountInput]] = defaultdict(list)
            for acc in government_accounts:
                custodian = (acc.official_custodian or "Official Custodian").strip().title()
                custodian_groups[custodian].append(acc)

            for custodian, c_accs in custodian_groups.items():
                is_in_state = any(a.jurisdiction == Jurisdiction.IN_STATE for a in c_accs)
                c_total_bal = sum(a.balance for a in c_accs)

                if is_in_state:
                    # In-state IDI: Demand deposits (checking) insured up to $250k SEPARATELY from time/savings (CDs, savings) insured up to $250k
                    demand_accs = [a for a in c_accs if a.deposit_type == DepositType.CHECKING]
                    time_savings_accs = [a for a in c_accs if a.deposit_type in (DepositType.SAVINGS, DepositType.CD, DepositType.MONEY_MARKET)]

                    demand_bal = sum(a.balance for a in demand_accs)
                    demand_ins = min(demand_bal, smdia)
                    demand_ratio = (demand_ins / demand_bal) if demand_bal > 0 else 1.0

                    ts_bal = sum(a.balance for a in time_savings_accs)
                    ts_ins = min(ts_bal, smdia)
                    ts_ratio = (ts_ins / ts_bal) if ts_bal > 0 else 1.0

                    c_ins = demand_ins + ts_ins
                    c_unins = c_total_bal - c_ins

                    category_breakdowns_map["government"]["balance"] += c_total_bal
                    category_breakdowns_map["government"]["insured"] += c_ins
                    category_breakdowns_map["government"]["uninsured"] += c_unins
                    category_breakdowns_map["government"]["owners"][custodian]["balance"] += c_total_bal
                    category_breakdowns_map["government"]["owners"][custodian]["insured"] += c_ins
                    category_breakdowns_map["government"]["owners"][custodian]["uninsured"] += c_unins

                    bank_insured += c_ins

                    for acc in demand_accs:
                        acc_ins = round(acc.balance * demand_ratio, 2)
                        acc_unins = round(acc.balance - acc_ins, 2)
                        status = "Fully Insured" if acc_unins == 0 else ("Partially Insured" if acc_ins > 0 else "Uninsured")
                        note = f"Official Custodian: {custodian} (In-State Demand/Checking pool, insured up to $250k under 12 CFR § 330.15)."
                        account_details.append(AccountInsuranceDetail(
                            account_id=acc.account_id,
                            account_name=acc.account_name or "Public Unit Demand Account",
                            category=acc.category.value,
                            bank_name=bank_name,
                            balance=acc.balance,
                            insured_amount=acc_ins,
                            uninsured_amount=acc_unins,
                            status=status,
                            notes=note
                        ))

                    for acc in time_savings_accs:
                        acc_ins = round(acc.balance * ts_ratio, 2)
                        acc_unins = round(acc.balance - acc_ins, 2)
                        status = "Fully Insured" if acc_unins == 0 else ("Partially Insured" if acc_ins > 0 else "Uninsured")
                        note = f"Official Custodian: {custodian} (In-State Time/Savings pool, insured up to $250k under 12 CFR § 330.15)."
                        account_details.append(AccountInsuranceDetail(
                            account_id=acc.account_id,
                            account_name=acc.account_name or "Public Unit Time/Savings Account",
                            category=acc.category.value,
                            bank_name=bank_name,
                            balance=acc.balance,
                            insured_amount=acc_ins,
                            uninsured_amount=acc_unins,
                            status=status,
                            notes=note
                        ))

                    if c_unins > 0:
                        recommendations.append(
                            f"Official custodian '{custodian}' has ${c_unins:,.2f} in uninsured public funds at in-state institution '{bank_name}'. "
                            f"Confirm whether the depository bank has pledged qualifying collateral securities under state public deposit protection acts."
                        )

                else:
                    # Out-of-state IDI: ALL deposits combined up to $250k
                    c_ins = min(c_total_bal, smdia)
                    c_unins = max(0.0, c_total_bal - smdia)
                    ratio = (c_ins / c_total_bal) if c_total_bal > 0 else 1.0

                    category_breakdowns_map["government"]["balance"] += c_total_bal
                    category_breakdowns_map["government"]["insured"] += c_ins
                    category_breakdowns_map["government"]["uninsured"] += c_unins
                    category_breakdowns_map["government"]["owners"][custodian]["balance"] += c_total_bal
                    category_breakdowns_map["government"]["owners"][custodian]["insured"] += c_ins
                    category_breakdowns_map["government"]["owners"][custodian]["uninsured"] += c_unins

                    bank_insured += c_ins

                    for acc in c_accs:
                        acc_ins = round(acc.balance * ratio, 2)
                        acc_unins = round(acc.balance - acc_ins, 2)
                        status = "Fully Insured" if acc_unins == 0 else ("Partially Insured" if acc_ins > 0 else "Uninsured")
                        note = f"Official Custodian: {custodian} (Out-of-State IDI: Combined demand and time/savings capped at $250k under 12 CFR § 330.15)."
                        account_details.append(AccountInsuranceDetail(
                            account_id=acc.account_id,
                            account_name=acc.account_name or "Public Unit Out-of-State Account",
                            category=acc.category.value,
                            bank_name=bank_name,
                            balance=acc.balance,
                            insured_amount=acc_ins,
                            uninsured_amount=acc_unins,
                            status=status,
                            notes=note
                        ))

                    if c_unins > 0:
                        recommendations.append(
                            f"Official custodian '{custodian}' holds public funds in an out-of-state bank ('{bank_name}') resulting in ${c_unins:,.2f} uninsured. "
                            f"In-state depository institutions offer dual $250k pools for demand vs time/savings deposits (up to $500,000 total per custodian)."
                        )

        # -------------------------------------------------------------
        # 6. RETIREMENT ACCOUNTS (12 CFR § 330.14)
        # -------------------------------------------------------------
        if retirement_accounts:
            ret_groups: Dict[str, List[AccountInput]] = defaultdict(list)
            for acc in retirement_accounts:
                owner = acc.owners[0].strip().title() if acc.owners else "Retirement Plan Participant"
                ret_groups[owner].append(acc)

            for owner, r_accs in ret_groups.items():
                r_bal = sum(a.balance for a in r_accs)
                r_ins = min(r_bal, smdia)
                r_unins = max(0.0, r_bal - smdia)
                ratio = (r_ins / r_bal) if r_bal > 0 else 1.0

                category_breakdowns_map["retirement"]["balance"] += r_bal
                category_breakdowns_map["retirement"]["insured"] += r_ins
                category_breakdowns_map["retirement"]["uninsured"] += r_unins
                category_breakdowns_map["retirement"]["owners"][owner]["balance"] += r_bal
                category_breakdowns_map["retirement"]["owners"][owner]["insured"] += r_ins
                category_breakdowns_map["retirement"]["owners"][owner]["uninsured"] += r_unins

                bank_insured += r_ins

                for acc in r_accs:
                    acc_ins = round(acc.balance * ratio, 2)
                    acc_unins = round(acc.balance - acc_ins, 2)
                    status = "Fully Insured" if acc_unins == 0 else ("Partially Insured" if acc_ins > 0 else "Uninsured")
                    note = f"Participant: {owner}. All qualifying retirement accounts (IRAs, Keoghs) aggregated up to $250k separate from non-retirement deposits (12 CFR § 330.14)."
                    account_details.append(AccountInsuranceDetail(
                        account_id=acc.account_id,
                        account_name=acc.account_name or "Retirement Account",
                        category=acc.category.value,
                        bank_name=bank_name,
                        balance=acc.balance,
                        insured_amount=acc_ins,
                        uninsured_amount=acc_unins,
                        status=status,
                        notes=note
                    ))

                if r_unins > 0:
                    recommendations.append(
                        f"Participant '{owner}' has ${r_unins:,.2f} in uninsured retirement deposits at '{bank_name}'. "
                        f"All IRAs (Traditional, Roth, SEP, SIMPLE) at the same IDI are aggregated up to $250,000. "
                        f"Consider rolling over or depositing additional retirement balances into a separate insured bank."
                    )

        # Bank summary
        bank_uninsured = max(0.0, bank_total - bank_insured)
        if bank_total > 0:
            bank_pct = float(Decimal(str((bank_insured / bank_total) * 100.0)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
        else:
            bank_pct = 100.0
        bank_summaries[bank_name] = BankInsuranceSummary(
            bank_name=bank_name,
            total_balance=round(bank_total, 2),
            insured_balance=round(bank_insured, 2),
            uninsured_balance=round(bank_uninsured, 2),
            percent_insured=bank_pct,
            categories={acc.category.value: round(acc.balance, 2) for acc in bank_accounts}
        )

    # Build category breakdowns
    statutory_refs = {
        "single": ("12 CFR § 330.6", "Accounts owned by one natural person with no beneficiaries, including sole proprietorships. Insured up to $250,000 in aggregate per depositor."),
        "joint": ("12 CFR § 330.9", "Accounts owned by 2+ natural persons with equal withdrawal rights and signatures. Each co-owner's combined joint interests at the IDI are insured up to $250,000."),
        "trust": ("12 CFR § 330.10 (April 1, 2024 Rule)", "Revocable and irrevocable trusts. Insured up to $250,000 per eligible beneficiary per grantor, capped at 5 beneficiaries ($1,250,000 maximum per grantor)."),
        "business": ("12 CFR § 330.11", "Corporation, partnership, and LLC deposits for entities engaged in independent activity. Insured up to $250,000 in aggregate per entity."),
        "government": ("12 CFR § 330.15", "Public unit accounts evaluated per official custodian. In-state banks provide separate $250k limits for demand vs time/savings deposits (up to $500,000 total)."),
        "retirement": ("12 CFR § 330.14", "Self-directed retirement accounts (Traditional/Roth IRAs, Keoghs). Insured up to $250,000 per participant, separate from non-retirement accounts.")
    }

    category_breakdowns: List[CategoryBreakdown] = []
    for cat_name, data in category_breakdowns_map.items():
        if data["balance"] > 0:
            ref, summary_text = statutory_refs.get(cat_name, ("12 CFR Part 330", "FDIC Insured Category"))
            owner_list = []
            for o_name, o_data in data["owners"].items():
                owner_list.append({
                    "owner": o_name,
                    "balance": round(o_data["balance"], 2),
                    "insured": round(o_data["insured"], 2),
                    "uninsured": round(o_data["uninsured"], 2)
                })

            category_breakdowns.append(CategoryBreakdown(
                category=cat_name,
                balance=round(data["balance"], 2),
                insured=round(data["insured"], 2),
                uninsured=round(data["uninsured"], 2),
                statutory_reference=ref,
                rule_summary=summary_text,
                owner_details=owner_list
            ))

    # Portfolio totals
    total_balance = sum(a.balance for a in accounts)
    total_insured = sum(a.insured_amount for a in account_details)
    total_uninsured = max(0.0, total_balance - total_insured)
    if total_balance > 0:
        pct_raw = (total_insured / total_balance) * 100.0
        pct_insured = float(Decimal(str(pct_raw)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
    else:
        pct_insured = 100.0
    is_fully_insured = (total_uninsured == 0.0)

    if is_fully_insured and total_balance > 0:
        recommendations.append("All deposited funds are 100% fully insured under current FDIC ownership structures and limits.")

    return InsuranceCalculationResult(
        summary=PortfolioSummary(
            total_balance=round(total_balance, 2),
            total_insured=round(total_insured, 2),
            total_uninsured=round(total_uninsured, 2),
            percent_insured=pct_insured,
            is_fully_insured=is_fully_insured,
            smdia_limit=smdia,
            accounts_count=len(accounts),
            institutions_count=len(banks)
        ),
        bank_summaries=bank_summaries,
        category_breakdowns=category_breakdowns,
        account_details=account_details,
        actionable_recommendations=recommendations,
        legal_disclaimer=_get_fdic_disclaimer()
    )


def _get_fdic_disclaimer() -> str:
    return (
        "STATUTORY & REGULATORY DISCLAIMER: This calculation estimate conforms to standard deposit insurance rules "
        "under 12 CFR Part 330, the FDIC Financial Institution Employee's Guide to Deposit Insurance, "
        "and reference EDIE calculation standards. This software was developed independently using publicly available "
        "regulations and data; it is NOT an official FDIC product and is NOT created, sponsored, or endorsed by the FDIC. "
        "Actual deposit insurance coverage in the event of an institution failure is determined exclusively by the FDIC "
        "based upon the official books and records of the failed depository institution, federal statutory guidelines, and "
        "applicable state law at the time of resolution. Deposits in non-insured institutions or non-deposit products "
        "(mutual funds, securities, annuities, cryptocurrencies) are not covered."
    )


# =====================================================================
# FDIC RULES KNOWLEDGE BASE & GUIDANCE ENGINE
# =====================================================================

FDIC_GUIDANCE_DB: Dict[str, Dict[str, Any]] = {
    "single": {
        "category": "Single Accounts (Individual)",
        "statutory_authority": "12 CFR § 330.6; 12 U.S.C. 1821(a)(1)",
        "smdia": 250000.0,
        "coverage_formula": "min(total_single_balance_at_bank, $250,000)",
        "key_requirements": [
            "Owned by one natural person with no named testamentary beneficiaries.",
            "Includes individual checking, savings, money market accounts, and certificates of deposit.",
            "Includes sole proprietorships / 'Doing Business As' (DBA) accounts (which are legally indistinguishable from the owner).",
            "Includes accounts established for deceased persons by an executor/administrator under single decedent estate rules."
        ],
        "calculation_rules": (
            "All funds deposited in one or more single accounts by the same individual at the same insured bank "
            "are aggregated and insured up to $250,000. Spreading funds across checking, savings, and CD accounts "
            "under individual ownership does not expand coverage beyond $250,000."
        ),
        "guidance_and_tips": [
            "To obtain more than $250,000 in coverage at the same bank, an individual can open qualifying joint accounts, trust/POD accounts, or retirement accounts.",
            "Sole proprietorship accounts are not separate business entities for FDIC purposes; they aggregate with the owner's personal single accounts."
        ]
    },
    "joint": {
        "category": "Joint Accounts",
        "statutory_authority": "12 CFR § 330.9; 12 U.S.C. 1821(a)(1)",
        "smdia": 250000.0,
        "coverage_formula": "min(total_joint_interests_per_co_owner, $250,000)",
        "key_requirements": [
            "All co-owners must be living natural persons (corporations, trusts, or estates cannot be joint owners).",
            "Each co-owner must have equal rights to withdraw deposits on their signature alone.",
            "Each co-owner must have personally signed a deposit account signature card (or qualifying electronic signature record).",
            "No testamentary beneficiaries (which would otherwise reclassify the account under trust rules)."
        ],
        "calculation_rules": (
            "Each co-owner's qualifying share of all joint accounts at the same bank is combined and insured up to $250,000. "
            "Unless specified otherwise in the account records, co-owners are presumed to hold equal shares. "
            "For example, a two-person joint account with a balance of $500,000 is fully insured ($250,000 per person)."
        ),
        "guidance_and_tips": [
            "Having multiple joint accounts with different combinations of co-owners does not provide each joint account an independent $250,000 limit. Each person's joint interests across all joint accounts at that bank are combined.",
            "Joint accounts provide separate coverage from each owner's single accounts."
        ]
    },
    "trust": {
        "category": "Trust Accounts (Revocable & Irrevocable)",
        "statutory_authority": "12 CFR § 330.10 (as amended effective April 1, 2024); 12 U.S.C. 1821(a)(1)",
        "smdia": 250000.0,
        "coverage_formula": "Number of Grantors × min(Number of Unique Eligible Beneficiaries, 5) × $250,000",
        "key_requirements": [
            "Applies to both informal revocable trusts (Payable on Death / POD / In Trust For / Totten trusts), formal living trusts, and irrevocable trusts.",
            "Account title or bank records must disclose the trust relationship (e.g., 'POD', 'ITF', 'Trustee for').",
            "Beneficiaries must be living natural persons, charitable organizations, or non-profit entities recognized under IRS code.",
            "Under the simplified April 1, 2024 rule, a hard cap of 5 beneficiaries per grantor is enforced ($1,250,000 maximum per grantor per bank)."
        ],
        "calculation_rules": (
            "Effective April 1, 2024, the FDIC eliminated the complex distinction between revocable and irrevocable trusts. "
            "Each grantor is insured up to $250,000 times the number of unique eligible beneficiaries, up to a maximum of 5 beneficiaries. "
            "Maximum coverage is $1,250,000 for a single grantor trust (5+ beneficiaries) and $2,500,000 for a two-grantor trust (e.g., married couple with 5+ beneficiaries) at each insured institution."
        ),
        "guidance_and_tips": [
            "Unequal allocation of trust interests or contingent vs primary status in estate documents no longer affects FDIC calculation; all eligible named beneficiaries are treated equally.",
            "If a trust names more than 5 beneficiaries, the insurance coverage remains capped at $1,250,000 per grantor."
        ]
    },
    "business": {
        "category": "Business Accounts (Corporations, Partnerships, LLCs, Unincorporated Associations)",
        "statutory_authority": "12 CFR § 330.11; 12 U.S.C. 1821(a)(1)",
        "smdia": 250000.0,
        "coverage_formula": "min(total_entity_deposits_at_bank, $250,000)",
        "key_requirements": [
            "The organization must be engaged in an 'independent activity' (not established solely to increase deposit insurance).",
            "Includes C-Corps, S-Corps, LLCs, general partnerships, limited partnerships, HOAs, non-profits, and unions.",
            "Accounts are insured in the name of the entity, completely separate from the personal accounts of officers, partners, or shareholders."
        ],
        "calculation_rules": (
            "All deposit accounts (checking, savings, CDs) owned by the business entity at the same insured bank are combined "
            "and insured up to $250,000 total. Operating accounts, payroll accounts, and reserve accounts of the same company aggregate."
        ),
        "guidance_and_tips": [
            "Separate divisions or unincorporated departments of the same corporation are NOT separately insured.",
            "Sole proprietorships are NOT covered under business accounts; they are single accounts of the sole owner.",
            "For balances exceeding $250,000, businesses often utilize reciprocal deposit networks (e.g., IntraFi / ICS / CDARS) to spread funds across chartered institutions."
        ]
    },
    "government": {
        "category": "Government / Public Unit Accounts",
        "statutory_authority": "12 CFR § 330.15; 12 U.S.C. 1821(a)(2)",
        "smdia": 250000.0,
        "coverage_formula": (
            "In-State Bank: min(demand_deposits, $250,000) + min(time_and_savings_deposits, $250,000) [up to $500,000 per custodian]. "
            "Out-of-State Bank: min(all_deposits, $250,000) per official custodian."
        ),
        "key_requirements": [
            "Deposits of the United States, any state, county, municipality, school district, public utility, or Native American tribe.",
            "Insurance is determined per 'Official Custodian' who has plenary custody and control over public funds by law.",
            "Bifurcated in-state vs out-of-state rules."
        ],
        "calculation_rules": (
            "For In-State Banks: An official custodian receives $250,000 for demand deposits (checking) PLUS an additional $250,000 "
            "for time and savings deposits (CDs, savings, money market), providing up to $500,000 total coverage. "
            "For Out-of-State Banks: All deposit types are aggregated and capped at $250,000 per custodian."
        ),
        "guidance_and_tips": [
            "Government depositors often hold balances far exceeding $500,000; state laws typically mandate that banks pledge collateral securities (e.g., US Treasuries, municipal bonds) to safeguard the uninsured portion of public deposits.",
            "Multiple subordinate accounts managed by the same official custodian do not receive separate insurance pools."
        ]
    },
    "retirement": {
        "category": "Certain Retirement Accounts (IRAs / Keoghs)",
        "statutory_authority": "12 CFR § 330.14; 12 U.S.C. 1821(a)(1)(C)",
        "smdia": 250000.0,
        "coverage_formula": "min(total_retirement_balance_per_owner, $250,000)",
        "key_requirements": [
            "Covers Traditional IRAs, Roth IRAs, SEP IRAs, SIMPLE IRAs, Section 457 deferred compensation plans, and self-directed Keogh plans.",
            "Must be self-directed retirement funds."
        ],
        "calculation_rules": (
            "All qualifying retirement deposits owned by the same person at the same insured bank are aggregated and insured up to $250,000. "
            "This coverage is completely separate from any personal single, joint, or trust accounts held by the individual at the same bank."
        ),
        "guidance_and_tips": [
            "Roth IRAs and Traditional IRAs at the same bank are added together under the single $250,000 retirement limit.",
            "401(k) and defined benefit plans are governed separately under employee benefit plan rules (12 CFR § 330.12)."
        ]
    }
}


def get_rule_guidance(category: Optional[str] = None, topic: Optional[str] = None) -> Dict[str, Any]:
    """Retrieves authoritative FDIC deposit insurance guidance and regulatory rules."""
    cat_clean = (category or "").strip().lower()
    topic_clean = (topic or "").strip().lower()

    if cat_clean in FDIC_GUIDANCE_DB:
        return FDIC_GUIDANCE_DB[cat_clean]

    # Search by topic if topic provided
    if topic_clean:
        for key, data in FDIC_GUIDANCE_DB.items():
            if key in topic_clean or topic_clean in key:
                return data

        if "trust" in topic_clean or "beneficiar" in topic_clean or "pod" in topic_clean:
            return FDIC_GUIDANCE_DB["trust"]
        if "joint" in topic_clean or "survivor" in topic_clean:
            return FDIC_GUIDANCE_DB["joint"]
        if "gov" in topic_clean or "custodian" in topic_clean or "public unit" in topic_clean:
            return FDIC_GUIDANCE_DB["government"]
        if "business" in topic_clean or "llc" in topic_clean or "corp" in topic_clean:
            return FDIC_GUIDANCE_DB["business"]
        if "ira" in topic_clean or "retire" in topic_clean:
            return FDIC_GUIDANCE_DB["retirement"]
        if "sole" in topic_clean or "single" in topic_clean:
            return FDIC_GUIDANCE_DB["single"]

        # Special topic guidance
        if "grace" in topic_clean or "death" in topic_clean or "merger" in topic_clean:
            return {
                "topic": "FDIC Grace Periods (Death of Depositor and Bank Mergers)",
                "statutory_authority": "12 CFR § 330.3; 12 CFR § 330.4",
                "death_grace_period": (
                    "Following the death of an account owner, the FDIC provides a 6-month grace period during which "
                    "deposit insurance coverage remains unchanged as if the deceased owner were still alive. "
                    "This allows beneficiaries and executors time to restructure accounts without loss of coverage."
                ),
                "merger_grace_period": (
                    "When two FDIC-insured banks merge, deposits previously held at each bank continue to be separately "
                    "insured for a 6-month grace period. Certificates of Deposit (CDs) are separately insured until the "
                    "earliest maturity date following the 6-month period."
                )
            }

        if "uninsured" in topic_clean or "non-deposit" in topic_clean or "crypto" in topic_clean or "stock" in topic_clean:
            return {
                "topic": "Non-Deposit Products Not Insured by FDIC",
                "statutory_authority": "Federal Deposit Insurance Act § 3(l); 12 CFR § 330.1",
                "uninsured_investments": [
                    "Mutual funds, exchange-traded funds (ETFs), and index funds.",
                    "Stocks, corporate bonds, municipal bonds, and treasury securities purchased through brokerage services.",
                    "Annuities, life insurance policies, and casualty insurance.",
                    "Cryptocurrencies, digital assets, and virtual tokens.",
                    "Contents of safe deposit boxes (physical property is not a bank deposit)."
                ],
                "fdic_insured_products": [
                    "Checking accounts (Demand Deposit Accounts).",
                    "Negotiable Order of Withdrawal (NOW) accounts.",
                    "Savings accounts.",
                    "Money Market Deposit Accounts (MMDAs).",
                    "Certificates of Deposit (CDs) and time deposits.",
                    "Official bank checks, cashier's checks, and money orders issued by the bank."
                ]
            }

    # Default overview
    return {
        "title": "FDIC Deposit Insurance Rules Overview (12 CFR Part 330)",
        "smdia": 250000.0,
        "overview": (
            "The Standard Maximum Deposit Insurance Amount (SMDIA) is $250,000 per depositor, "
            "per insured bank, for each ownership category. Depositors can obtain more than $250,000 "
            "in coverage at a single institution by structuring funds across different statutory ownership categories."
        ),
        "available_categories": list(FDIC_GUIDANCE_DB.keys()),
        "key_statutory_categories": {k: v["category"] for k, v in FDIC_GUIDANCE_DB.items()},
        "trust_rule_amendment": "April 1, 2024 unified trust rules cap coverage at 5 beneficiaries per grantor ($1.25M max per grantor per bank).",
        "guidance_source": "FDIC Financial Institution Employee's Guide to Deposit Insurance & Deposit Insurance Calculator Calculator"
    }
