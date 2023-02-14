export interface ExpenseCsvRow {
    categoryName: string;
    familyMember: string;
    date: string;
    comment: string;
    currencyId: string;
    categoryId: string;
    amount: string;
    accountId: string;
}

export interface IncomeCsvRow {
    source: string;
    familyMember: string;
    date: string;
    comment: string;
    currencyId: string;
    categoryId: string;
    amount: string;
    accountId: string;
}

export interface TransferCsvRow {
    toName: string;
    fromName: string;
    amount: string;
    familyMember: string;
    date: string;
    comment: string;
    currencyId: string;
    toAccountId: string;
    fromAccountId: string;
}

export interface ExchangeCsvRow {
    accountName: string;
    amountBought: string;
    amountSold: string;
    currencyIdBought: string;
    currencyIdSold: string;
    accountId: string;
    familyMember: string;
    date: string;
    comment: string;
}

export interface CurrencyCsvRow {
    id: string;
    name: string;
    rate: string;
}


export interface CategoryCsvRow {
    id: string;
    name: string;
    parentId: string;
}

export interface AccountCsvRow {
    id: string;
    name: string;
    dunno: string;
}

export interface ResultCsvRow {
    date: string;
    incomesAmount?: string | number;
    expensesAmount?: string | number;
    account: string;
    category: string;
    tags?: string;
    currency: string;
    description?: string;
}

export interface RevolutCsvRow {
    recordType: string;
    product: string;
    startedDate: string;
    completedDate: string;
    description: string;
    amount: string;
    fee: string;
    currency: string;
    state: string;
    balance: string;
}

export interface GSExpenseOrIncomeCsvRow {
    amount: number;
    currency: string;
    account: string;
    category?: string;
    date: string;
    description?: string;
}

export interface HomeFinanceData {
    currencies: string[];
    incomeCategories: CategoryData[];
    expenseCategories: CategoryData[];
    accounts: string[];
}

export interface CategoryData {
    synonyms: string[];
    name: string;
    tokens: string[];
}

export interface BankStatementProcessingResult<TCSVRow> {
    expenses: GSExpenseOrIncomeCsvRow[];
    incomes: GSExpenseOrIncomeCsvRow[];
    empty: TCSVRow[];
    manual: TCSVRow[];
}