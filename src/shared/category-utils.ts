import { ExpenseCategory, IncomeCategory } from "../model";

const expenseCategoriesMap: { category: ExpenseCategory, tokens: string[] }[] = [
    {
        category: 'Интернет, связь',
        tokens: [
            'T-MOBILE THUIS',
        ],
    },
    {
        category: 'Самолет\\поезд\\автобус',
        tokens: [
            'NS GROEP',
        ],
    },
    {
        category: 'Банковские услуги',
        tokens: ['ABN AMRO Bank N.V.               Basic Package'],
    },
    {
        category: 'Одежда',
        tokens: [
            'PRIMARK',
        ],
    },
    {
        category: 'Квартплата',
        tokens: [
            'VITENS NV',
            'GBLT incasso maandelijkse',
            'GEMEENTE ALMERE BELASTINGEN ',
            'Vattenfall Klantenservice N.V.',
        ],
    },
    {
        category: 'Dutch',
        tokens: [
            'Zuyeva Elena',
            'Smirnova Elena',
        ],
    },
    {
        category: 'Кругозор',
        tokens: [
            'Amazon Downloads',
        ],
    },
    {
        category: 'мед страховка',
        tokens: [
            'Zorgverzekeringen',
            'Nationale-Nederlanden Zorg',
        ],
    },
    {
        category: 'Кошка',
        tokens: [
            'OnlinePets',
            'Pharmapets.nl',
            'NL21ZZZ330520730000',
        ],
    },
    {
        category: 'Дом, семья',
        tokens: [
            'Kruidvat',
            'Rataplan',
            'kringloop',
            'Gamma',
            'Aliexpress',
        ],
    },
    {
        category: 'Продукты',
        tokens: [
            'Almere Polski Supermar',
            'Sligro',
            'NL21ZZZ330520730000',
            'weernekers Ah',
            'smullende Steven',
            'Tanger Almere',
            'Amazingoriental Almere',
            'Sabores Delicatessen',
            'Poelier Van Den Bor',
            'Robin En Kees Agf',
            'eksotika',
            'Koelewijn',
            'Westfriesland Vers',
            'Lidl',
            'Jumbo',
            'karsemeijer Poelie',
            'Janssen Groente',
            'Crowdfarming',
            'Schuur-Koop',
            'Spar City',
        ],
    },
    {
        category: 'Обеды, перекусы',
        tokens: [
            'Visboer Albert',
            'Jonico', // Martino's ice cream
            'Bubbletea',
        ],
    },
    {
        category: 'Траты на жизнь',
        tokens: [
            'VOLMACHTKANTOOR',
        ],
    },
    {
        category: 'Развлечения',
        tokens: [
            'Amazon EU SARL by Stripe',
        ],
    },
]

const incomeCategoryMap: { category: IncomeCategory, tokens: string[] }[] = [
    {
        category: 'Mobiquity',
        tokens: [
            'Mobiquity',
        ],
    },
]


export function getCategory(revolutCsvRow: { amount: number, description: string }): string | undefined {
    let result: ExpenseCategory | IncomeCategory | undefined;
    const amount = revolutCsvRow.amount;
    if (amount > 0) {
        const found = incomeCategoryMap.find(entry =>
            entry.tokens.some(token => revolutCsvRow.description.indexOf(token) >= 0)
        );
        result = found ? found.category : 'Возврат';
    } else {
        const found = expenseCategoriesMap.find(entry =>
            entry.tokens.some(token => revolutCsvRow.description.indexOf(token) >= 0)
        );
        result = found?.category;
    }

    return result;
}