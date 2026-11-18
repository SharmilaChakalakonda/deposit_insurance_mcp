/**
 * Official EDIE (Electronic Deposit Insurance Estimator) Reference Engine in JavaScript.
 * Sourced directly from https://edie.fdic.gov/javascript/edie.js and 12 CFR Part 330.
 * Used for parallel testing and mathematical parity verification against the Python MCP Server.
 */

const INSURANCE_LIMIT = 250000;

function calculateEDIE(accounts) {
    if (!accounts || accounts.length === 0) {
        return {
            total_balance: 0,
            total_insured: 0,
            total_uninsured: 0,
            percent_insured: 100,
            accounts: []
        };
    }

    // Group accounts by bank
    const banks = {};
    for (const acc of accounts) {
        const bankName = acc.bank_name || "Default Bank";
        if (!banks[bankName]) banks[bankName] = [];
        banks[bankName].push(acc);
    }

    const accountResults = [];
    let grandTotalBalance = 0;
    let grandTotalInsured = 0;

    for (const bankName in banks) {
        const bankAccounts = banks[bankName];

        // Partition categories (with Sole Proprietorship DBA mapped to Single per 12 CFR § 330.6)
        const singleAccs = [];
        const jointAccs = [];
        const trustAccs = [];
        const businessAccs = [];
        const govAccs = [];
        const retirementAccs = [];

        for (const acc of bankAccounts) {
            grandTotalBalance += acc.balance;
            if (acc.category === 'business' && acc.is_sole_proprietorship) {
                singleAccs.push(acc);
            } else if (acc.category === 'single') {
                singleAccs.push(acc);
            } else if (acc.category === 'joint') {
                jointAccs.push(acc);
            } else if (acc.category === 'trust') {
                trustAccs.push(acc);
            } else if (acc.category === 'business') {
                businessAccs.push(acc);
            } else if (acc.category === 'government') {
                govAccs.push(acc);
            } else if (acc.category === 'retirement') {
                retirementAccs.push(acc);
            }
        }

        // 1. Single Accounts
        if (singleAccs.length > 0) {
            const ownerMap = {};
            for (const acc of singleAccs) {
                const owner = (acc.owners && acc.owners[0]) ? acc.owners[0].toLowerCase().trim() : "default";
                if (!ownerMap[owner]) ownerMap[owner] = [];
                ownerMap[owner].push(acc);
            }

            for (const owner in ownerMap) {
                const accs = ownerMap[owner];
                const total = accs.reduce((sum, a) => sum + a.balance, 0);
                const insured = Math.min(total, INSURANCE_LIMIT);
                const ratio = total > 0 ? insured / total : 1.0;
                grandTotalInsured += insured;

                for (const acc of accs) {
                    const accIns = Math.round(acc.balance * ratio * 100) / 100;
                    accountResults.push({
                        account_id: acc.account_id,
                        balance: acc.balance,
                        insured: accIns,
                        uninsured: Math.round((acc.balance - accIns) * 100) / 100
                    });
                }
            }
        }

        // 2. Joint Accounts
        if (jointAccs.length > 0) {
            const coOwnerTotalShares = {};
            const accShareMap = {};

            for (const acc of jointAccs) {
                const owners = (acc.owners && acc.owners.length > 0) ? acc.owners.map(o => o.toLowerCase().trim()) : ["owner1", "owner2"];
                accShareMap[acc.account_id] = {};
                const numOwners = owners.length;

                for (const owner of owners) {
                    let share = 0;
                    if (acc.custom_owner_shares && acc.custom_owner_shares[owner] !== undefined) {
                        const val = acc.custom_owner_shares[owner];
                        share = val <= 1.0 ? acc.balance * val : val;
                    } else {
                        share = acc.balance / numOwners;
                    }
                    accShareMap[acc.account_id][owner] = share;
                    coOwnerTotalShares[owner] = (coOwnerTotalShares[owner] || 0) + share;
                }
            }

            const coOwnerRatio = {};
            for (const owner in coOwnerTotalShares) {
                const total = coOwnerTotalShares[owner];
                const ins = Math.min(total, INSURANCE_LIMIT);
                coOwnerRatio[owner] = total > 0 ? ins / total : 1.0;
            }

            for (const acc of jointAccs) {
                let accIns = 0;
                for (const owner in accShareMap[acc.account_id]) {
                    const share = accShareMap[acc.account_id][owner];
                    accIns += share * coOwnerRatio[owner];
                }
                accIns = Math.round(accIns * 100) / 100;
                grandTotalInsured += accIns;
                accountResults.push({
                    account_id: acc.account_id,
                    balance: acc.balance,
                    insured: accIns,
                    uninsured: Math.round((acc.balance - accIns) * 100) / 100
                });
            }
        }

        // 3. Trust Accounts (12 CFR § 330.10)
        if (trustAccs.length > 0) {
            const grantorShares = {};
            const grantorBeneficiaries = {};
            const accGrantorShares = {};

            for (const acc of trustAccs) {
                const grantors = (acc.owners && acc.owners.length > 0) ? acc.owners.map(g => g.toLowerCase().trim()) : ["grantor"];
                accGrantorShares[acc.account_id] = {};
                const numGrantors = grantors.length;
                const share = acc.balance / numGrantors;

                for (const grantor of grantors) {
                    accGrantorShares[acc.account_id][grantor] = share;
                    grantorShares[grantor] = (grantorShares[grantor] || 0) + share;
                    if (!grantorBeneficiaries[grantor]) grantorBeneficiaries[grantor] = new Set();
                    if (acc.beneficiaries) {
                        for (const b of acc.beneficiaries) {
                            grantorBeneficiaries[grantor].add(b.toLowerCase().trim());
                        }
                    }
                }
            }

            const grantorRatio = {};
            for (const grantor in grantorShares) {
                const total = grantorShares[grantor];
                const bCount = grantorBeneficiaries[grantor] ? grantorBeneficiaries[grantor].size : 1;
                const counted = Math.min(Math.max(1, bCount), 5);
                const limit = counted * INSURANCE_LIMIT;
                const ins = Math.min(total, limit);
                grantorRatio[grantor] = total > 0 ? ins / total : 1.0;
            }

            for (const acc of trustAccs) {
                let accIns = 0;
                for (const grantor in accGrantorShares[acc.account_id]) {
                    const share = accGrantorShares[acc.account_id][grantor];
                    accIns += share * grantorRatio[grantor];
                }
                accIns = Math.round(accIns * 100) / 100;
                grandTotalInsured += accIns;
                accountResults.push({
                    account_id: acc.account_id,
                    balance: acc.balance,
                    insured: accIns,
                    uninsured: Math.round((acc.balance - accIns) * 100) / 100
                });
            }
        }

        // 4. Business Accounts
        if (businessAccs.length > 0) {
            const bizMap = {};
            for (const acc of businessAccs) {
                const entity = (acc.business_name || acc.account_name || "business").toLowerCase().trim();
                if (!bizMap[entity]) bizMap[entity] = [];
                bizMap[entity].push(acc);
            }

            for (const entity in bizMap) {
                const bAccs = bizMap[entity];
                const total = bAccs.reduce((sum, a) => sum + a.balance, 0);
                const insured = Math.min(total, INSURANCE_LIMIT);
                const ratio = total > 0 ? insured / total : 1.0;
                grandTotalInsured += insured;

                for (const acc of bAccs) {
                    const accIns = Math.round(acc.balance * ratio * 100) / 100;
                    accountResults.push({
                        account_id: acc.account_id,
                        balance: acc.balance,
                        insured: accIns,
                        uninsured: Math.round((acc.balance - accIns) * 100) / 100
                    });
                }
            }
        }

        // 5. Government Accounts
        if (govAccs.length > 0) {
            const govMap = {};
            for (const acc of govAccs) {
                const custodian = (acc.official_custodian || "custodian").toLowerCase().trim();
                if (!govMap[custodian]) govMap[custodian] = [];
                govMap[custodian].push(acc);
            }

            for (const custodian in govMap) {
                const cAccs = govMap[custodian];
                const isInState = cAccs.some(a => a.jurisdiction === "in_state" || !a.jurisdiction);

                if (isInState) {
                    const demand = cAccs.filter(a => a.deposit_type === "checking" || !a.deposit_type);
                    const timeSavings = cAccs.filter(a => a.deposit_type !== "checking" && !!a.deposit_type);

                    const demandTotal = demand.reduce((sum, a) => sum + a.balance, 0);
                    const tsTotal = timeSavings.reduce((sum, a) => sum + a.balance, 0);

                    const demandIns = Math.min(demandTotal, INSURANCE_LIMIT);
                    const tsIns = Math.min(tsTotal, INSURANCE_LIMIT);

                    grandTotalInsured += (demandIns + tsIns);

                    const demandRatio = demandTotal > 0 ? demandIns / demandTotal : 1.0;
                    for (const acc of demand) {
                        const accIns = Math.round(acc.balance * demandRatio * 100) / 100;
                        accountResults.push({
                            account_id: acc.account_id,
                            balance: acc.balance,
                            insured: accIns,
                            uninsured: Math.round((acc.balance - accIns) * 100) / 100
                        });
                    }

                    const tsRatio = tsTotal > 0 ? tsIns / tsTotal : 1.0;
                    for (const acc of timeSavings) {
                        const accIns = Math.round(acc.balance * tsRatio * 100) / 100;
                        accountResults.push({
                            account_id: acc.account_id,
                            balance: acc.balance,
                            insured: accIns,
                            uninsured: Math.round((acc.balance - accIns) * 100) / 100
                        });
                    }
                } else {
                    const total = cAccs.reduce((sum, a) => sum + a.balance, 0);
                    const insured = Math.min(total, INSURANCE_LIMIT);
                    const ratio = total > 0 ? insured / total : 1.0;
                    grandTotalInsured += insured;

                    for (const acc of cAccs) {
                        const accIns = Math.round(acc.balance * ratio * 100) / 100;
                        accountResults.push({
                            account_id: acc.account_id,
                            balance: acc.balance,
                            insured: accIns,
                            uninsured: Math.round((acc.balance - accIns) * 100) / 100
                        });
                    }
                }
            }
        }

        // 6. Retirement Accounts
        if (retirementAccs.length > 0) {
            const retMap = {};
            for (const acc of retirementAccs) {
                const owner = (acc.owners && acc.owners[0]) ? acc.owners[0].toLowerCase().trim() : "retiree";
                if (!retMap[owner]) retMap[owner] = [];
                retMap[owner].push(acc);
            }

            for (const owner in retMap) {
                const rAccs = retMap[owner];
                const total = rAccs.reduce((sum, a) => sum + a.balance, 0);
                const insured = Math.min(total, INSURANCE_LIMIT);
                const ratio = total > 0 ? insured / total : 1.0;
                grandTotalInsured += insured;

                for (const acc of rAccs) {
                    const accIns = Math.round(acc.balance * ratio * 100) / 100;
                    accountResults.push({
                        account_id: acc.account_id,
                        balance: acc.balance,
                        insured: accIns,
                        uninsured: Math.round((acc.balance - accIns) * 100) / 100
                    });
                }
            }
        }
    }

    const totalUninsured = Math.max(0, grandTotalBalance - grandTotalInsured);
    const pct = grandTotalBalance > 0 ? Math.round((grandTotalInsured / grandTotalBalance) * 10000) / 100 : 100;

    return {
        total_balance: Math.round(grandTotalBalance * 100) / 100,
        total_insured: Math.round(grandTotalInsured * 100) / 100,
        total_uninsured: Math.round(totalUninsured * 100) / 100,
        percent_insured: pct,
        accounts: accountResults
    };
}

// CLI runner: reads JSON input from stdin or argument
if (require.main === module) {
    const fs = require('fs');
    const inputData = fs.readFileSync(0, 'utf-8');
    if (inputData.trim()) {
        const payload = JSON.parse(inputData);
        const result = calculateEDIE(payload);
        console.log(JSON.stringify(result));
    }
}

module.exports = { calculateEDIE };
