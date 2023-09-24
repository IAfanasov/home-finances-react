import { FormEvent, useCallback, useContext, useState } from "react";
import './AddExpenseForm.css';
import { HomeFinanceDataContext } from "../shared/data-context";
import { appendExpences } from '../google-sheets/appendExpences';


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

    const onSubmit = useCallback(async function onSubmit(event: FormEvent) {
        event.preventDefault();
        const formElem = event.target as HTMLFormElement;
        const isValid = formElem.checkValidity();
        if (!isValid) {
            setWasValidated(true);
            return;
        }
        const formData = new FormData(formElem);

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
            setWasValidated(false);
            const form = (event.target as HTMLFormElement);

            [
                ExpenseFormField.amount,
                ExpenseFormField.comment,
            ].forEach(x => (form.elements.namedItem(x) as HTMLFormElement).value = '');
        } catch (error) {
            console.error(error);
            alert(JSON.stringify(error));
        } finally {
            setSubmitting(false);
        }
    }, [setWasValidated, setSubmitting])


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
                {homeFinanceData!.currencies.sort().map(currency =>
                    <option key={currency} selected={currency==='EUR'}>{currency}</option>
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