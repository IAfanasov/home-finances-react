import { GSExpenseOrIncomeCsvRow, HomeFinanceData, RevolutCsvRow } from "../model";
import * as Papa from "papaparse";
import { getCategory } from "../shared/category-utils";

export function processRevolut(csvString: string, data: HomeFinanceData): { expenses: GSExpenseOrIncomeCsvRow[], incomes: GSExpenseOrIncomeCsvRow[], empty: RevolutCsvRow[] } {
    console.log(`Processing revolut`);
    try {
        const records = getRevolutRecords(csvString);
        console.log(`Processing ${records.length} parsed records`);
        const incomes: GSExpenseOrIncomeCsvRow [] = [];
        const empty: RevolutCsvRow [] = [];
        const expenses: GSExpenseOrIncomeCsvRow[] = [];
        for (const revolutRecord of records) {
            const amount = +revolutRecord.amount;
            if (amount === 0) { // 0.00 === 0 is false for some reason
                empty.push(revolutRecord);
            } else {
                const description = revolutRecord.description;
                const gsRecord: GSExpenseOrIncomeCsvRow = {
                    amount: Math.abs(amount),
                    currency: revolutRecord.currency,
                    account: 'Revolut',
                    category: getCategory({amount, description}, data),
                    date: revolutRecord.startedDate,
                    description,
                };

                if (amount > 0) {
                    if (description.indexOf('Balance migration to another') >= 0
                        || description.indexOf('Payment from I Afanasov Cj') >= 0) {
                        // TODO transfer
                    } else {
                        incomes.push(gsRecord);
                    }
                } else {
                    expenses.push(gsRecord);
                }
            }
        }
        return {expenses, incomes, empty};
    } catch (err) {
        console.error(err);
        throw err;
    }
}

function getRevolutRecords(csvString: string): RevolutCsvRow[] {
    return Papa.parse<string[]>(csvString).data
        .filter(row => row[0])
        .map(([recordType, product, startedDate, completedDate, description, amount, fee, currency, state, balance]) => ({
            recordType, product, startedDate, completedDate, description, amount, fee, currency, state, balance
        }))
        .sort((a, b) => Date.parse(b.startedDate) - Date.parse(a.startedDate));
}
