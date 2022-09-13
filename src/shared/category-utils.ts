import { HomeFinanceData } from "../model";

export function getCategory(record: { amount: number, description: string }, data: HomeFinanceData): string | undefined {

    let result: string | undefined;
    const amount = record.amount;
    if (amount > 0) {
        const found = data.incomeCategories.find(entry =>
            entry.tokens.some(token => record.description.toLowerCase().indexOf(token.toLowerCase()) >= 0)
        );
        result = found ? found.name : 'Возврат';
    } else {
        const found = data.expenseCategories.find(entry =>
            entry.tokens.some(token => record.description.toLowerCase().indexOf(token.toLowerCase()) >= 0)
        );
        result = found?.name;
    }

    return result;
}