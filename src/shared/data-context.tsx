import React, { useCallback, useEffect, useState } from "react";
import { HomeFinanceData, GSExpenseOrIncomeCsvRow, GSTransferCsvRow, GSExchangeCsvRow, CategoryData } from "../model";

const defaultValue: {
    homeFinanceData: HomeFinanceData | null,
    loadData: () => Promise<void>,
    loading: boolean,
} = {
    homeFinanceData: null,
    loadData: async () => {},
    loading: true,
};
export const HomeFinanceDataContext = React.createContext(defaultValue);

export const HomeFinanceDataContextProvider = ({ children, gapiReady }: { children: React.ReactNode, gapiReady: boolean }) => {
    const [homeFinanceData, setHomeFinanceData] = useState<HomeFinanceData | null>(null);
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
                console.error(`Error loading range '${range}':`, err);
                return [];
            }
            const result = response.result;
            if (!result?.values?.length) {
                console.error(`No values found for range '${range}'.`);
                return [];
            }
            return result.values;
        }

        function parseExpenseIncomeData(values: string[][], type: 'income' | 'expense'): GSExpenseOrIncomeCsvRow[] {
            // Skip the header row
            const dataRows = values.slice(1);

            return dataRows.map(row => ({
                date: row[6], // Column G
                amount: type === 'expense' ? -Number(row[2]) : Number(row[2]), // Column C
                currency: row[3], // Column D
                account: row[4], // Column E
                category: row[5], // Column F
                description: row[7], // Column H
                id: '', // Placeholder, will be assigned later if needed
                rowIndex: 0, // Placeholder
                duplicate: false, // Placeholder
            }));
        }

        function parseTransferData(values: string[][]): GSTransferCsvRow[] {
            const transfers: GSTransferCsvRow[] = [];
            const dataRows = values.slice(1);

            dataRows.forEach(row => {
                const amount = Number(row[0]); // Column A
                const currency = row[1]; // Column B
                const fromAccount = row[2]; // Column C
                const toAccount = row[3]; // Column D
                const date = row[4]; // Column E
                const description = row[5]; // Column F

                transfers.push({
                    date: date,
                    amount: amount,
                    currency: currency,
                    fromAccount: fromAccount,
                    toAccount: toAccount,
                    description: description,
                    id: '', // Placeholder
                    rowIndex: 0, // Placeholder
                    duplicate: false, // Placeholder
                });
            });
            return transfers;
        }

        function parseExchangeData(values: string[][]): GSExchangeCsvRow[] {
            const exchanges: GSExchangeCsvRow[] = [];
            const dataRows = values.slice(1);

            dataRows.forEach(row => {
                const account = row[0]; // Account
                const boughtAmount = Number(row[1]); // Bought amount
                const soldAmount = Number(row[2]); // Sold Amount
                const boughtCurrency = row[3]; // Bought Currency
                const soldCurrency = row[4]; // Sold Currency
                const date = row[5]; // Date

                exchanges.push({
                    date: date,
                    amount: boughtAmount, // This is the net amount for the exchange, not the individual legs
                    currency: boughtCurrency, // This is the target currency
                    account: account,
                    description: `Exchange: ${soldAmount} ${soldCurrency} to ${boughtAmount} ${boughtCurrency}`,
                    type: 'exchange',
                    originalAmount: soldAmount,
                    originalCurrency: soldCurrency,
                    targetAmount: boughtAmount,
                    targetCurrency: boughtCurrency,
                    id: '', // Placeholder
                    rowIndex: 0, // Placeholder
                    duplicate: false, // Placeholder
                });
            });
            return exchanges;
        }

        function extractCategories(values: string[][]): CategoryData[] {
            return values
                .slice(1)
                .filter((x) => x[0])
                .map((x) => ({
                    name: x[0],
                    tokens: x[3] ? x[3].split('\n') : [],
                }));
        }

        const [expenseValues, incomeValues, transferValues, exchangeValues, categoriesValues, accountsValues, incomeCategoriesValues, currenciesValues] = await Promise.all([
            loadArrayFromSpreadsheet('expense!A:H'),
            loadArrayFromSpreadsheet('Income!A:H'),
            loadArrayFromSpreadsheet('Transfer!A:F'),
            loadArrayFromSpreadsheet('Exchange!A:G'),
            loadArrayFromSpreadsheet('Expense category!A:D'),
            loadArrayFromSpreadsheet('Account!A:A'),
            loadArrayFromSpreadsheet('Income category!A:D'),
            loadArrayFromSpreadsheet('Currency!B:B'),
        ]);

        setHomeFinanceData({
            accounts: accountsValues.flat(),
            incomeCategories: extractCategories(incomeCategoriesValues).sort((a, b) => a.name > b.name ? 1 : -1),
            expenseCategories: extractCategories(categoriesValues).sort((a, b) => a.name > b.name ? 1 : -1),
            currencies: currenciesValues.flat(),
            expenses: parseExpenseIncomeData(expenseValues, 'expense'),
            incomes: parseExpenseIncomeData(incomeValues, 'income'),
            transfers: parseTransferData(transferValues),
            exchanges: parseExchangeData(exchangeValues),
        });
        setLoading(false);

    }, []); 

    useEffect(() => {
        if (gapiReady) {
            loadData();
        }
    }, [gapiReady, loadData]);
    
    return (
        <HomeFinanceDataContext.Provider value={{ homeFinanceData, loadData, loading }}>
            {children}
        </HomeFinanceDataContext.Provider>
    );
}
export const HomeFinanceDataContextConsumer = HomeFinanceDataContext.Consumer;