import { AbnCsvRow } from "./model";
import * as Papa from 'papaparse';
import { ExpenseCategory, GSExpenseOrIncomeCsvRow, IncomeCategory } from "../model";

export function processAbn(csvString: string): { expenses: GSExpenseOrIncomeCsvRow[], incomes: GSExpenseOrIncomeCsvRow[], empty: AbnCsvRow[] } {
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
                    category: getCategory(abnRecord),
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
        console.log({incomes})
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

const categoriesMap: { token: string, category: ExpenseCategory }[] = [
    {token: 'T-MOBILE NETHERLANDS', category: 'Интернет, связь'},
    {token: 'T-MOBILE THUIS', category: 'Интернет, связь'},
    {token: 'NS GROEP', category: 'Самолет\\поезд\\автобус'},
    {token: 'ABN AMRO Bank N.V.               Basic Package', category: 'Банковские услуги'},
    {token: 'PRIMARK', category: 'Одежда'},
    {token: 'VITENS NV', category: 'Квартплата'},
    {token: 'GBLT incasso maandelijkse', category: 'Квартплата'},
    {token: 'GEMEENTE ALMERE BELASTINGEN ', category: 'Квартплата'},
    {token: 'Vattenfall Klantenservice N.V.', category: 'Квартплата'},
    {token: 'Zuyeva Elena', category: 'Dutch'},
    {token: 'Smirnova Elena', category: 'Dutch'},
    {token: 'Zorgverzekeringen', category: 'мед страховка'},
    {token: 'Nationale-Nederlanden Zorg', category: 'мед страховка'},
    {token: 'OnlinePets', category: 'Кошка'},
    {token: 'Pharmapets.nl', category: 'Кошка'},
    {token: 'NL21ZZZ330520730000', category: 'Кошка'},
    {token: 'Kruidvat', category: 'Дом, семья'},
    {token: 'Almere Polski Supermar', category: 'Продукты'},
    {token: 'Sligro', category: 'Продукты'},
    {token: 'VOLMACHTKANTOOR', category: 'Траты на жизнь'},
    {token: 'Amazon EU SARL by Stripe', category: 'Развлечения'},
]

function getCategory(revolutCsvRow: AbnCsvRow): string | undefined {
    let result: ExpenseCategory | IncomeCategory | undefined;
    const amount = +revolutCsvRow.amount;
    if (amount > 0) {
        result = 'Возврат';
    } else {
        for (const entry of categoriesMap) {
            if (revolutCsvRow.description.indexOf(entry.token) >= 0) {
                result = entry.category;
            }
        }
    }

    return result;
}
