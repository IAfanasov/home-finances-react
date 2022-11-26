import * as Papa from 'papaparse';
import { BankStatementProcessingResult, GSExpenseOrIncomeCsvRow, HomeFinanceData } from "../model";
import { getCategory } from "../shared/category-utils";
import { AbnCsvRow } from "./model";

export function processAbn(csvString: string, data: HomeFinanceData): BankStatementProcessingResult<AbnCsvRow> {
    console.log(`Processing ABN`);
    try {
        const records = getAbnRecords(csvString);
        console.log(`Processing ${records.length} parsed records`);
        console.log({ records })
        const incomes: GSExpenseOrIncomeCsvRow[] = [];
        const empty: AbnCsvRow[] = [];
        const manual: AbnCsvRow[] = [];
        const expenses: GSExpenseOrIncomeCsvRow[] = [];
        for (const abnRecord of records) {
            const amount = +abnRecord.amount.replace(',', '.');
            const { description } = abnRecord;

            if ((description.indexOf('hypotheek') >= 0 && description.indexOf('ABN AMRO BANK NV') >= 0)
                || (description.indexOf('ABN AMRO KREDIETEN BV') >= 0)) {
                manual.push(abnRecord);
                continue;
            }
            if (amount === 0) {
                empty.push(abnRecord);
            } else {
                const gsRecord: GSExpenseOrIncomeCsvRow = {
                    amount: Math.abs(amount),
                    currency: abnRecord.mutationcode,
                    account: 'ABN',
                    category: getCategory({ amount, description }, data),
                    date: toDashedDate(abnRecord.transactiondate),
                    description,
                };

                if (amount > 0) {
                    incomes.push(gsRecord);
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
