import {
    BankStatementProcessingResult,
    GSExpenseOrIncomeCsvRow,
    HomeFinanceData,
    RevolutCsvRow,
} from '../model';
import * as Papa from 'papaparse';
import { getCategory } from '../shared/category-utils';

export function processRevolut(
    csvString: string,
    data: HomeFinanceData,
): BankStatementProcessingResult<RevolutCsvRow> {
    console.log(`Processing revolut`);
    try {
        const records = getRevolutRecords(csvString);
        console.log(`Processing ${records.length} parsed records`);
        const incomes: GSExpenseOrIncomeCsvRow[] = [];
        const empty: RevolutCsvRow[] = [];
        const manual: RevolutCsvRow[] = [];
        const expenses: GSExpenseOrIncomeCsvRow[] = [];
        for (const revolutRecord of records) {
            const amount = +revolutRecord.amount;
            const { description, recordType } = revolutRecord;
            if (recordType === 'ATM'
                || description.indexOf('Payment from I Afanasov Cj') >= 0) {
                manual.push(revolutRecord);
                continue;
            }
            if (amount === 0) {
                // 0.00 === 0 is false for some reason
                empty.push(revolutRecord);
            } else {
                const gsRecord: GSExpenseOrIncomeCsvRow = {
                    amount: Math.abs(amount),
                    currency: revolutRecord.currency,
                    account: 'Revolut',
                    category: getCategory({ amount, description }, data),
                    date: revolutRecord.startedDate,
                    description,
                };

                if (amount > 0) {
                    if (
                        description.indexOf('Balance migration to another') >= 0
                        || recordType === 'CASHBACK'
                    ) {
                        // TODO transfer
                    } else {
                        incomes.push(gsRecord);
                    }
                } else {
                    expenses.push(gsRecord);
                }
            }
        }
        return { expenses, incomes, empty, manual };
    } catch (err) {
        console.error(err);
        throw err;
    }
}

function getRevolutRecords(csvString: string): RevolutCsvRow[] {
    return Papa.parse<string[]>(csvString)
        .data.filter((row) => row[0] && 'Type'!==row[0])
        .map(
            ([
                recordType,
                product,
                startedDate,
                completedDate,
                description,
                amount,
                fee,
                currency,
                state,
                balance,
            ]) => ({
                recordType,
                product,
                startedDate,
                completedDate,
                description,
                amount,
                fee,
                currency,
                state,
                balance,
            }),
        )
        .sort((a, b) => Date.parse(b.startedDate) - Date.parse(a.startedDate));
}
