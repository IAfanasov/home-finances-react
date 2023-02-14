import { parse } from 'date-fns';
import { doc, Firestore, WriteBatch, writeBatch } from 'firebase/firestore';
import { Dispatch, SetStateAction } from 'react';
import { CategoryData, HomeFinanceData } from '../model';
import { Collections, toBeCategorizedCategory } from '../shared/constants';
import { parseCSV } from '../shared/parse-cvs';
import { expensesCsv } from './HomeFinances - expense.csv';


export async function importExpenses(db: Firestore, homeFinanceData: HomeFinanceData | null, setSubmitting: Dispatch<SetStateAction<boolean>>) {
    if (!homeFinanceData) {
        return;
    }

    const categoryMap = homeFinanceData.expenseCategories.reduce((acc, val) => {
        acc.set(val.name, val);
        val.synonyms?.forEach(s => {
            acc.set(s, val);
            acc.set(`"${s}"`, val);
        })
        return acc;
    }, new Map<string, CategoryData>());

    const now = new Date();
    const rows = parseCSV(expensesCsv).map((row: string[]) => {
        const rawCategory: string = row[5];

        const category = categoryMap.get(rawCategory)?.name || toBeCategorizedCategory;

        const format = row[6][10] === ' '
            ? row[6][2] === '/'
                ? 'dd/MM/yyyy kk:mm:ss' : 'yyyy-MM-dd kk:mm:ss'
            : row[6][2] === '/' ? 'dd/MM/yyyy' : 'yyyy-MM-dd';
        // window['parseDateFns'] = parse
        let parsedDate = parse(row[6], format, now);
        if (isNaN(parsedDate.valueOf())) {
            console.warn('Invalid date', row[6], format)
        }
        return {
            amount: row[2],
            currency: doc(db, Collections.currencies, row[3]),
            account: doc(db, Collections.accounts, row[4]),
            category: doc(db, Collections.expence_categories, category),
            date: parsedDate,
            description: row[7] || '',
            rawRecord: row,
        };
    });

    console.log({ rows })

    const ids = new Map<string, number>()

    const batches: WriteBatch[] = [];
    const batchSize = 500;
    for (let ind = 0; ind < rows.length; ind += batchSize) {

        const batch = writeBatch(db);
        rows.slice(ind, ind + batchSize).forEach(row => {
            ids.set(row.rawRecord[6], (ids.get(row.rawRecord[6]) || 0) + 1);
            const id = ids.get(row.rawRecord[6]);
            batch.set(doc(db, Collections.expences, `${row.rawRecord[6]}-${id}`), row);
        });
        batches.push(batch);
    }
    setSubmitting(true);
    console.time('batch')
    try {

        await Promise.all(batches.map(b => b.commit()));
    } finally {

        console.timeEnd('batch')
        setSubmitting(false);
    }
}

export async function importCategories(db: Firestore) {

    const csv = `Без категории,13231842,-1,,Uncategorized
    Техника/электроника,13231835,-1,,Devices and electronis
    Коррекция,13231828,-1,,Correction
    Страховка кредитки,13231827,-1,,Credit card insurance
    ЯХЗ,13231840,-1,,Dunno
    Из Excel,13231884,-1,,From the first excel
    Будущий возврат,13231875,-1,,Future refund
    Тяжбы по алиментам,13231892,-1,,Alimony expenses
    Инвестиции,13231877,-1,,Investments
    Невозвратные долги,13231878,-1,,Dead loans
    Возврат,15033962,-1,,Refund
    Благотворительность,16302322,-1,Wikimedia,Charity
    Отпуск/Путешествия,13231819,-1,,Vacarions and trips
    Жилье,13231823,13231819,"booking.com
    Ibis
    Premier Inn
    Hostel
    Revolut Stays",Accommodation
    Транспорт,13231825,13231819,,Vacation transport
    Самолет\поезд\автобус,13231822,13231819,"NS GROEP
    Db Vertrieb
    Pegasus
    SUPERSAVER
    Turkish Airlines
    Vueling",Flight\train\bus
    Аренда машины,13231820,13231819,,Car rental
    Public,13231824,13231819,,Public transport during trips
    Виза,13231821,13231819,,Visa
    экскурсии,15992142,13231819,,Excursions
    Еда,13231829,-1,,Food
    Продукты,13231831,13231829,"Almere Polski Supermar
    Sligro
    NL21ZZZ330520730000
    weernekers Ah
    smullende Steven
    Tanger Almere
    Amazingoriental Almere
    Sabores Delicatessen
    Poelier Van Den Bor
    Robin En Kees Agf
    eksotika
    Koelewijn
    Westfriesland Vers
    Lidl
    ALBERT HEIJN
    Jumbo
    karsemeijer Poelie
    Janssen Groente
    Crowdfarming
    Schuur-Koop
    Spar City
    Edeka
    Rewe 
    Rewe-
    Saffraan MiniMarket
    Berk Gida
    Ccv*cccp Vof
    DIRK VDBROEK
    Vof Prins Posthumus
    kwaliteitsvishande
    ALDI
    Flevohoning
    Zabka
    Kaashandel
    Magnum
    Supermar
    Spar",Grocery
    "Обеды, перекусы",13231830,13231829,"Visboer Albert
    Jonico
    Bubbletea
    Bubble Tea
    Restaurant
    Ristorante
    Mcdonalds
    Backwerk
    Cafe
    Baeckerei
    brauhaus
    Hmshost Almere Centrum
    Ah To Go
    Hmshost Amsterdam Cent
    Uber * Eats
    Uber *Eats
    Poke Perfect Almere
    Mcdonald
    Perekucity
    Degir Men
    Restoran
    Doner
    Ikea Amsterdam Ikea Fo","Lunch, Snack"
    Образование и развитие,13231836,-1,,Education and growth
    Английский,13231839,13231836,Pauline's Training Services,English
    Кругозор,13231838,13231836,Amazon Downloads,Outlook
    Испанский,13231837,13231836,,Spanish
    Dutch,15283992,13231836,"Zuyeva Elena
    Smirnova Elena
    PIANOVA",Dutch
    Траты на жизнь,13231858,-1,VOLMACHTKANTOOR,Life expenses
    Проезд,13231863,13231858,,Public transport
    "Интернет, связь",13231859,13231858,"T-MOBILE
    skype","Internet, communication"
    Одежда,13231860,13231858,"PRIMARK
    New Yorker
    Woolworth
    H & M","Clothers, shoes"
    Подарки,13231861,13231858,,Gifts
    Отдых,13231862,13231858,,Recreation
    Развлечения,13231865,13231858,"Amazon EU SARL by Stripe
    Spotify
    Playstation
    Viaplay
    Sportvisserij
    Pathe Theaters",Entertainment
    Такси,13231864,13231858,"Uber *trip
    Uber * Pending
    taxi.yandex
    Takside",Taxi
    Банковские услуги,15078218,13231858,ABN AMRO Bank N.V.               Basic Package,Bank services
    "Дом, семья",13231866,-1,"Kruidvat
    Rataplan
    kringloop
    Gamma
    Aliexpress
    Action 1386
    Action 1194
    Action 1203
    So-Low
    Praxis
    Intratuin","House, Family"
    Хозтовары,13231867,13231866,,Household goods
    Квартплата,13231868,13231866,"VITENS NV
    GBLT incasso maandelijkse
    GEMEENTE ALMERE BELASTINGEN 
    Vattenfall Klantenservice N.V.",Utilities
    Родители,15754705,13231866,,Parents
    Ремонт,15846002,13231866,,House repair
    Кошка,15933835,13231866,"OnlinePets
    ZOOPLUS
    Pharmapets
    NL21ZZZ330520730000",Miya
    "Здоровье, красота",13231869,-1,"Dunya Goz Hastanesi
    Rui Bandeira",Health and beauty
    "Аптека, препараты",13231872,13231869,"Too Forte Pharma New
    Pharmacy",Drugs
    Лечение,13231870,13231869,,Treatment
    Спорт,13231871,13231869,,Sport
    мед страховка,15078217,13231869,"Zorgverzekeringen
    Nationale-Nederlanden Zorg",Medical insurance
    Коммандировачные,13231882,-1,,Business refundables 
    Златке,13231888,-1,,Zlata
    Алименты,13231891,13231888,,Alimony
    Кредит,13231889,13231888,,Loan
    Другое,13231890,13231888,,Other
    Kids,,,"Ekomed
    Ivf Farm
    Institut Reproduktivno
    Ip Baqyt
    Gkp Na Phv Up Zdr Galm",Kids`;

    const batch = writeBatch(db);

    parseCSV(csv).forEach(([syn, id, parent, rawTokens, name]: string[]) => {
        console.log({ name });
        const tokens = rawTokens?.split(`\n`).map(x => x.trimStart()).filter(x => x);
        batch.set(doc(db, Collections.expence_categories, name.replaceAll('/', '_')), {
            name,
            tokens,
            synonyms: [syn.trimStart()]
        });
    });

    await batch.commit();
}
export async function importCurrencies(db: Firestore) {
    const batch = writeBatch(db);
    [
        'RUB',
        'CZK',
        'PLN',
        'THB',
        'PHP',
        'KHR',
        'CNY',
        'BYR',
        'USD',
        'EUR',
        'VND',
        'SGD',
        'MYR',
        'KGS',
        'TRY',
        'KZT'
    ].forEach(c => {
        batch.set(doc(db, Collections.currencies, c), {});
    });

    await batch.commit();
}
