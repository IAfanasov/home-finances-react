import { useCallback, useEffect, useState } from 'react';

export interface StatementDataEntry {
    date: string;
    amount: number;
    currency: string;
    category?: string;
    account: string;
    description: string;
    type: 'income' | 'expense' | 'transfer-in' | 'transfer-out' | 'exchange';
    fromAccount?: string; // For transfers
    toAccount?: string; // For transfers
    originalAmount?: number; // For exchanges
    originalCurrency?: string; // For exchanges
    targetAmount?: number; // For exchanges
    targetCurrency?: string; // For exchanges
}

export function useLoadStatementData(gapiReady: boolean) {
    const [data, setData] = useState<StatementDataEntry[] | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        const spreadsheetId = process.env.REACT_APP_SPREADSHEET_ID;

        async function loadArrayFromSpreadsheet(range: string): Promise<string[][]> {
            let response: gapi.client.Response<gapi.client.sheets.ValueRange>;
            try {
                response = await gapi.client.sheets.spreadsheets.values.get({
                    spreadsheetId: spreadsheetId,
                    range,
                });
            } catch (err: any) {
                console.error(err);
                return [];
            }
            const result = response.result;
            if (!result?.values?.length) {
                console.error('No values found.');
                return [];
            }
            return result.values;
        }

        function parseExpenseIncomeData(values: string[][], type: 'income' | 'expense'): StatementDataEntry[] {
            // Skip the header row
            const dataRows = values.slice(1);

            return dataRows.map(row => ({
                date: row[6], // Column G
                amount: type === 'expense' ? -Number(row[2]) : Number(row[2]), // Column C
                currency: row[3], // Column D
                account: row[4], // Column E
                category: row[5], // Column F
                description: row[7], // Column H
                type: type,
            }));
        }

        function parseTransferData(values: string[][]): StatementDataEntry[] {
            const transfers: StatementDataEntry[] = [];
            const dataRows = values.slice(1);

            dataRows.forEach(row => {
                const amount = Number(row[0]); // Column A
                const currency = row[1]; // Column B
                const fromAccount = row[2]; // Column C
                const toAccount = row[3]; // Column D
                const date = row[4]; // Column E
                const description = row[5]; // Column F

                // Transfer Out
                transfers.push({
                    date: date,
                    amount: -amount,
                    currency: currency,
                    account: fromAccount,
                    description: description,
                    type: 'transfer-out',
                    fromAccount: fromAccount,
                    toAccount: toAccount,
                });

                // Transfer In
                transfers.push({
                    date: date,
                    amount: amount,
                    currency: currency,
                    account: toAccount,
                    description: description,
                    type: 'transfer-in',
                    fromAccount: fromAccount,
                    toAccount: toAccount,
                });
            });
            return transfers;
        }

        function parseExchangeData(values: string[][]): StatementDataEntry[] {
            const exchanges: StatementDataEntry[] = [];
            const dataRows = values.slice(1);

            dataRows.forEach(row => {
                const account = row[0]; // Account
                const boughtAmount = Number(row[1]); // Bought amount
                const soldAmount = Number(row[2]); // Sold Amount
                const boughtCurrency = row[3]; // Bought Currency
                const soldCurrency = row[4]; // Sold Currency
                const date = row[5]; // Date
                // const rate = Number(row[6]); // Rate - not directly used in StatementData

                // Outflow (Sold part)
                exchanges.push({
                    date: date,
                    amount: -soldAmount,
                    currency: soldCurrency,
                    account: account,
                    description: `Exchange: Sold ${soldAmount} ${soldCurrency} for ${boughtAmount} ${boughtCurrency}`,
                    type: 'exchange',
                    originalAmount: soldAmount,
                    originalCurrency: soldCurrency,
                    targetAmount: boughtAmount,
                    targetCurrency: boughtCurrency,
                });

                // Inflow (Bought part)
                exchanges.push({
                    date: date,
                    amount: boughtAmount,
                    currency: boughtCurrency,
                    account: account,
                    description: `Exchange: Bought ${boughtAmount} ${boughtCurrency} with ${soldAmount} ${soldCurrency}`,
                    type: 'exchange',
                    originalAmount: soldAmount,
                    originalCurrency: soldCurrency,
                    targetAmount: boughtAmount,
                    targetCurrency: boughtCurrency,
                });
            });
            return exchanges;
        }

        const [expenseValues, incomeValues, transferValues, exchangeValues] = await Promise.all([
            loadArrayFromSpreadsheet('expense!A:H'), 
            loadArrayFromSpreadsheet('income!A:H'),
            loadArrayFromSpreadsheet('transfer!A:F'),
            loadArrayFromSpreadsheet('Exchange!A:G')
        ]);

        const expenseData = parseExpenseIncomeData(expenseValues, 'expense');
        const incomeData = parseExpenseIncomeData(incomeValues, 'income');
        const transferData = parseTransferData(transferValues);
        const exchangeData = parseExchangeData(exchangeValues);

        const allData = [...expenseData, ...incomeData, ...transferData, ...exchangeData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setData(allData);
        setLoading(false);

    }, []); 

    useEffect(() => {
        if (gapiReady) {
            loadData();
        }
    }, [gapiReady, loadData]);

    return { data, loading, loadData };
}