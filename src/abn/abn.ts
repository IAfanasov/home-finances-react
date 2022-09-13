import { AbnCsvRow } from "./model";
import * as Papa from 'papaparse';
import { GSExpenseOrIncomeCsvRow, HomeFinanceData } from "../model";
import { getCategory } from "../shared/category-utils";

export function processAbn(csvString: string, data: HomeFinanceData): { expenses: GSExpenseOrIncomeCsvRow[], incomes: GSExpenseOrIncomeCsvRow[], empty: AbnCsvRow[] } {
    console.log(`Processing ABN`);
    try {
        const records = getAbnRecords(csvString);
        console.log(`Processing ${records.length} parsed records`);
        console.log({records})
        const incomes: GSExpenseOrIncomeCsvRow [] = [];
        const empty: AbnCsvRow [] = [];
        const expenses: GSExpenseOrIncomeCsvRow[] = [];
        for (const abnRecord of records) {
            const amount = +abnRecord.amount.replace(',', '.');
            if (amount === 0) {
                empty.push(abnRecord);
            } else {

                const gsRecord: GSExpenseOrIncomeCsvRow = {
                    amount: Math.abs(amount),
                    currency: abnRecord.mutationcode,
                    account: 'ABN',
                    category: getCategory({amount, description: abnRecord.description}, data),
                    date: toDashedDate(abnRecord.transactiondate),
                    description: abnRecord.description,
                };

                if (amount > 0) {
                    incomes.push(gsRecord);
                } else {
                    // ''
                    //
                    if ((abnRecord.description.indexOf('hypotheek') >= 0 && abnRecord.description.indexOf('ABN AMRO BANK NV') >= 0)
                        || (abnRecord.description.indexOf('ABN AMRO KREDIETEN BV') >= 0)) {
                        // TODO transfer
                    } else {
                        expenses.push(gsRecord);
                    }
                }
            }
        }
        return {expenses, incomes, empty};
    } catch (err) {
        console.error(err);
        throw err;
    }
}

export function toDashedDate(numStr: string): string {
    return `${numStr.substr(0, 4)}-${numStr.substr(4, 2)}-${numStr.substr(6, 2)}`;
}


function getAbnRecords(csvString: string): AbnCsvRow[] {
    return Papa.parse<string[]>(csvString).data
        .filter(row => row[0])
        .map(([accountNumber, mutationcode, transactiondate, startsaldo, endsaldo, valuedate, amount, description]) => ({
            accountNumber, mutationcode, transactiondate, startsaldo, endsaldo, valuedate, amount, description
        }));
}

