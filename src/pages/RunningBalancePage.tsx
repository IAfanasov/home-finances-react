import React, { useContext, useMemo } from 'react';
import { HomeFinanceDataContext } from '../shared/data-context';
import { Transaction } from '../model';

export function RunningBalancePage() {
    const { homeFinanceData, loading } = useContext(HomeFinanceDataContext);

    const allData = useMemo(() => {
        if (!homeFinanceData) {
            return [];
        }
        const { expenses, incomes, transfers, exchanges } = homeFinanceData;
        // Convert specific types to generic Transaction for unified processing
        const allTransactions: Transaction[] = [
            ...expenses.map(e => ({
                date: e.date,
                amount: e.amount,
                currency: e.currency,
                category: e.category,
                account: e.account,
                description: e.description || '',
                type: 'expense' as 'expense',
            })),
            ...incomes.map(i => ({
                date: i.date,
                amount: i.amount,
                currency: i.currency,
                category: i.category,
                account: i.account,
                description: i.description || '',
                type: 'income' as 'income',
            })),
            ...transfers.flatMap(t => [
                {
                    date: t.date,
                    amount: -t.amount,
                    currency: t.currency,
                    account: t.fromAccount,
                    description: t.description || '',
                    type: 'transfer-out' as 'transfer-out',
                    fromAccount: t.fromAccount,
                    toAccount: t.toAccount,
                },
                {
                    date: t.date,
                    amount: t.amount,
                    currency: t.currency,
                    account: t.toAccount,
                    description: t.description || '',
                    type: 'transfer-in' as 'transfer-in',
                    fromAccount: t.fromAccount,
                    toAccount: t.toAccount,
                },
            ]),
            ...exchanges.flatMap(e => [
                {
                    date: e.date,
                    amount: -e.originalAmount!,
                    currency: e.originalCurrency!,
                    account: e.account,
                    description: e.description || `Exchange: Sold ${e.originalAmount} ${e.originalCurrency} for ${e.targetAmount} ${e.targetCurrency}`,
                    type: 'exchange' as 'exchange',
                    originalAmount: e.originalAmount,
                    originalCurrency: e.originalCurrency,
                    targetAmount: e.targetAmount,
                    targetCurrency: e.targetCurrency,
                },
                {
                    date: e.date,
                    amount: e.targetAmount!,
                    currency: e.targetCurrency!,
                    account: e.account,
                    description: e.description || `Exchange: Bought ${e.targetAmount} ${e.targetCurrency} with ${e.originalAmount} ${e.originalCurrency}`,
                    type: 'exchange' as 'exchange',
                    originalAmount: e.originalAmount,
                    originalCurrency: e.originalCurrency,
                    targetAmount: e.targetAmount,
                    targetCurrency: e.targetCurrency,
                },
            ]),
        ];

        return allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [homeFinanceData]);

    const { dailyBalances, accounts, dates } = useMemo(() => {
        if (!allData.length || !homeFinanceData) {
            return { dailyBalances: {}, accounts: [], dates: [] };
        }

        const accounts = homeFinanceData.accounts;
        const dailyBalances: Record<string, Record<string, number>> = {};
        const dates = [...new Set(allData.map(d => d.date))].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        dates.forEach(date => {
            dailyBalances[date] = {};
            accounts.forEach(account => {
                dailyBalances[date][account] = 0;
            });
        });

        allData.forEach(transaction => {
            const date = transaction.date;
            if (dailyBalances[date] && dailyBalances[date][transaction.account] !== undefined) {
                dailyBalances[date][transaction.account] += transaction.amount;
            }
        });

        // Calculate running balances
        for (let i = 1; i < dates.length; i++) {
            const currentDate = dates[i];
            const previousDate = dates[i - 1];
            accounts.forEach(account => {
                dailyBalances[currentDate][account] += dailyBalances[previousDate][account];
            });
        }

        return { dailyBalances, accounts, dates };
    }, [allData, homeFinanceData]);

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div>
            <h2>Running Balance</h2>
            <table className="table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Total</th>
                        {accounts.map(account => (
                            <th key={account}>{account}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {dates.map(date => {
                        const total = accounts.reduce((acc, account) => acc + dailyBalances[date][account], 0);
                        return (
                            <tr key={date}>
                                <td>{date}</td>
                                <td>{total.toFixed(2)}</td>
                                {accounts.map(account => (
                                    <td key={account}>{dailyBalances[date][account].toFixed(2)}</td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default RunningBalancePage;
