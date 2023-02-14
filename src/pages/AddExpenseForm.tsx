import { parse } from 'date-fns';
import { getApp } from 'firebase/app';
import { collection, doc, Firestore, getDocs, getFirestore, setDoc, writeBatch } from 'firebase/firestore';
import { Dispatch, FormEvent, SetStateAction, useCallback, useContext, useState } from "react";
import { appendExpences } from '../google-sheets/appendExpences';
import { importExpenses } from '../migration/migrations';
import { Collections } from '../shared/constants';
import { HomeFinanceDataContext } from "../shared/data-context";
import './AddExpenseForm.css';


enum ExpenseFormField {
    amount = 'amount',
    currency = 'currency',
    date = 'date',
    category = 'category',
    account = 'account',
    comment = 'comment',
}

export function AddExpensePage() {
    const [wasValidate, setWasValidated] = useState<boolean>();
    const [submitting, setSubmitting] = useState<boolean>(false);
    const { data: homeFinanceData } = useContext(HomeFinanceDataContext);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
    const app = getApp();
    const db = getFirestore(app);

    const onSubmit = useCallback(async function onSubmit(event: FormEvent) {
        event.preventDefault();
        const formElem = event.target as HTMLFormElement;
        const isValid = formElem.checkValidity();
        if (!isValid) {
            setWasValidated(true);
            return;
        }
        const formData = new FormData(formElem);

        await importExpenses(db, homeFinanceData, setSubmitting);

        // setWasValidated(false);
        // const form = (event.target as HTMLFormElement);

        // [
        //     ExpenseFormField.amount,
        //     ExpenseFormField.comment,
        // ].forEach(x => (form.elements.namedItem(x) as HTMLFormElement).value = '');
    }, [setWasValidated, setSubmitting, homeFinanceData])


    return <form className={(wasValidate ? 'was-validated' : 'needs-validation') + ' col-xxl-3 col-xl-4 col-lg-5 col-md-6 col-sm-7 col-12'}
        onSubmit={onSubmit}
        noValidate>

        <h3>Add an expense</h3>

        <div className='input-group mb-3'>
            <input type="date"
                name={ExpenseFormField.date}
                required
                className="form-control"
                placeholder="Date"
                defaultValue={todayStr} />
        </div>

        <div className='input-group mb-3'>
            <input type="number"
                min={0}
                step={0.01}
                className="form-control"
                required
                name={ExpenseFormField.amount}
                placeholder="Amount" />
            <select className="currency-select form-select flex-grow-0 flex-shrink-0"
                name={ExpenseFormField.currency}>
                {homeFinanceData!.currencies.map(currency =>
                    <option key={currency}>{currency}</option>
                )}
            </select>
        </div>

        <select defaultValue=''
            required
            name={ExpenseFormField.category}
            className="form-select mb-3">
            <option value="">Select a category</option>
            {homeFinanceData!.expenseCategories
                .sort((a, b) => a.name > b.name ? 1 : -1)
                .map(category =>
                    <option key={category.name}>{category.name}</option>
                )}
        </select>

        <select defaultValue='Cash'
            required
            name={ExpenseFormField.account}
            className="form-select mb-3">
            <option value="">Select an account</option>
            {homeFinanceData!.accounts.map(account =>
                <option key={account}>{account}</option>
            )}
        </select>

        <div className="mb-3">
            <label htmlFor="inputComment"
                className="form-label">Comment</label>
            <textarea className="form-control"
                id="inputComment"
                name={ExpenseFormField.comment}
                rows={2}></textarea>
        </div>

        <button type='submit'
            disabled={submitting}
            className="btn btn-dark ms-auto d-block">
            Save
        </button>
    </form>
}

export default AddExpensePage;

async function copyCollection(db: Firestore, srcCollectionName: string, destCollectionName: string) {
    const batch = writeBatch(db);

    const sourceDocs = await getDocs(collection(db, srcCollectionName));
    sourceDocs.docs.forEach(d => {
        batch.set(doc(db, destCollectionName, d.id), d.data());
    })
    await batch.commit();
}
async function saveToGoogleSheets(formData: FormData, setSubmitting: { (value: SetStateAction<boolean>): void; (arg0: boolean): void; }) {
    const values = [
        [
            ExpenseFormField.amount,
            ExpenseFormField.currency,
            ExpenseFormField.account,
            ExpenseFormField.category,
            ExpenseFormField.date,
            ExpenseFormField.comment,
        ].map(x => formData.get(x) as string)
    ];

    setSubmitting(true);
    try {
        await appendExpences(values);
    } catch (error) {
        console.error(error);
        alert(JSON.stringify(error));
    } finally {
        setSubmitting(false);
    }
}
async function saveToFirebase(formData: FormData, setSubmitting: Dispatch<SetStateAction<boolean>>) {

    const app = getApp();
    const db = getFirestore(app);

    const expencesColRef = collection(db, Collections.expences);
    const accountColRef = collection(db, Collections.accounts);
    const expenseCategoriesColRef = collection(db, Collections.expence_categories);

    const body = {
        [ExpenseFormField.amount]: formData.get(ExpenseFormField.amount),
        [ExpenseFormField.currency]: formData.get(ExpenseFormField.currency),
        [ExpenseFormField.account]: doc(accountColRef, formData.get(ExpenseFormField.account) as string),
        [ExpenseFormField.category]: doc(expenseCategoriesColRef, formData.get(ExpenseFormField.category) as string),
        [ExpenseFormField.date]: parse(formData.get(ExpenseFormField.date) as string, 'yyyy-MM-dd', new Date()),
        [ExpenseFormField.comment]: formData.get(ExpenseFormField.comment),
    };

    await setDoc(doc(expencesColRef), body);
}


