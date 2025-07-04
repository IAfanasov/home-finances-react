import React, { useContext, useState } from 'react';
import { StatementDataEntry, useLoadStatementData } from '../google-sheets/useLoadStatementData';
import { HomeFinanceDataContext } from '../shared/data-context';

interface StatementPageProps {
    gapiReady: boolean;
}

export function StatementPage({ gapiReady }: StatementPageProps) {
    const { data: homeFinanceData } = useContext(HomeFinanceDataContext);
    const [selectedAccount, setSelectedAccount] = useState<string>(homeFinanceData?.accounts[0] || '');
    const today = new Date();
    const initialMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);

    const { data, loading, loadData } = useLoadStatementData(gapiReady);

    const filteredData = data?.filter(record => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const recordDate = new Date(record.date);
        
        return (
            (selectedAccount === '' || record.account === selectedAccount) &&
            recordDate.getFullYear() === year &&
            recordDate.getMonth() === (month - 1)
        );
    })?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const moneySummary = filteredData?.reduce((acc, record) => {
        if (!acc[record.currency]) {
            acc[record.currency] = { moneyIn: 0, moneyOut: 0 };
        }

        if (record.type === 'income' || record.type === 'transfer-in') {
            acc[record.currency].moneyIn += record.amount;
        } else if (record.type === 'expense' || record.type === 'transfer-out') {
            acc[record.currency].moneyOut += Math.abs(record.amount);
        }
        return acc;
    }, {} as Record<string, { moneyIn: number; moneyOut: number }>) || {};

    const calculateBalances = () => {
        const balances: Record<string, { beginningBalance: number; endingBalance: number }> = {};

        const [year, month] = selectedMonth.split('-').map(Number);
        const firstDayOfMonth = new Date(year, month - 1, 1);
        const lastDayOfMonth = new Date(year, month, 0);

        // Set times to 00:00:00 for accurate date-only comparison
        firstDayOfMonth.setHours(0, 0, 0, 0);
        lastDayOfMonth.setHours(0, 0, 0, 0);

        data?.forEach(record => {
            if (selectedAccount !== '' && record.account !== selectedAccount) {
                return;
            }

            if (!balances[record.currency]) {
                balances[record.currency] = { beginningBalance: 0, endingBalance: 0 };
            }

            const recordDate = new Date(record.date);
            recordDate.setHours(0, 0, 0, 0); // Normalize record date for comparison

            if (recordDate < firstDayOfMonth) {
                balances[record.currency].beginningBalance += record.amount;
            }
            if (recordDate <= lastDayOfMonth) {
                balances[record.currency].endingBalance += record.amount;
            }
        });
        return balances;
    };

    const balances = calculateBalances();

    const getMonths = () => {
        const months = [];
        for (let i = 0; i < 120; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthValue = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            const monthLabel = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            months.push({ value: monthValue, label: monthLabel });
        }
        return months;
    };

    const getTransactionKind = (row: StatementDataEntry) => {
        switch (row.type) {
            case 'expense':
                return { icon: 'bi-dash-circle', text: '', color: 'text-danger' };
            case 'income':
                return { icon: 'bi-plus-circle', text: '', color: 'text-success' };
            case 'transfer-in':
                return { icon: 'bi-arrow-right', text: `${row.fromAccount}`, color: 'text-success' };
            case 'transfer-out':
                return { icon: 'bi-arrow-right', text: `${row.toAccount}`, color: 'text-danger' };
            case 'exchange':
                return { icon: 'bi-arrow-left-right', text: `${row.originalAmount} ${row.originalCurrency} to ${row.targetAmount} ${row.targetCurrency}`, color: 'text-secondary' };
            default:
                return { icon: '', text: '', color: '' };
        }
    };

    return (
        <div>
            <h2>Statement</h2>
            <div className="row mb-3 align-items-end">
                <div className="col-md-4">
                    <label htmlFor="monthSelect" className="form-label">Filter by Month:</label>
                    <select
                        id="monthSelect"
                        className="form-select"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                        {getMonths().map((month) => (
                            <option key={month.value} value={month.value}>
                                {month.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-md-4">
                    <label htmlFor="accountSelect" className="form-label">Filter by Account:</label>
                    <select
                        id="accountSelect"
                        className="form-select"
                        value={selectedAccount}
                        onChange={(e) => setSelectedAccount(e.target.value)}
                >
                        {homeFinanceData?.accounts.sort().map((account) => (
                            <option key={account} value={account}>
                                {account}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-md-4 d-flex justify-content-end">
                    <button className="btn btn-primary" onClick={loadData} disabled={loading || !gapiReady}>
                        {loading ? 'Loading...' : 'Load data'}
                    </button>
                </div>
            </div>
            <div className="row mb-3">
                <div className="col">
                    <table className="table table-sm">
                        <thead>
                            <tr>
                                <th>Currency</th>
                                <th>Money In</th>
                                <th>Money Out</th>
                                <th>Beginning Balance</th>
                                <th>Ending Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(moneySummary).map(currency => (
                                <tr key={currency}>
                                    <th>{currency}</th>
                                    <td className="text-success">{moneySummary[currency].moneyIn.toFixed(2)}</td>
                                    <td className="text-danger">{moneySummary[currency].moneyOut.toFixed(2)}</td>
                                    <td className={balances[currency]?.beginningBalance >= 0 ? 'text-success' : 'text-danger'}>{balances[currency]?.beginningBalance.toFixed(2) || '0.00'}</td>
                                    <td className={balances[currency]?.endingBalance >= 0 ? 'text-success' : 'text-danger'}>{balances[currency]?.endingBalance.toFixed(2) || '0.00'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {filteredData ? (
                <table className="table">
                    <thead>
                        <tr>
                            <th>Kind</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Currency</th>
                            <th>Account</th>
                            <th>Category</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((row, index) => {
                            const { icon, text, color } = getTransactionKind(row);
                            return (
                                <tr key={index}>
                                    <td className="no-wrap-cell"><i className={`bi ${icon} ${color}`}></i> {text}</td>
                                    <td className="no-wrap-cell"><time dateTime={row.date} title={row.date}>{new Date(row.date).toISOString().slice(0, 10)}</time></td>
                                    <td className="no-wrap-cell">{row.amount}</td>
                                    <td className="no-wrap-cell">{row.currency}</td>
                                    <td className="no-wrap-cell">{row.account}</td>
                                    <td className="no-wrap-cell">{row.category}</td>
                                    <td>{row.description}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
}

export default StatementPage;
