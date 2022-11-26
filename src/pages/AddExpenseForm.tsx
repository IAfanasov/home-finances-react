import { FormEvent, useContext, useState } from "react";
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
    const initialState: { wasValidate: boolean } = { wasValidate: false };
    const [state, setState] = useState(initialState);
    const { data: homeFinanceData } = useContext(HomeFinanceDataContext);

    async function onSubmit(event: FormEvent) {
        setState(current => ({ ...current, wasValidate: true }));
        event.preventDefault();
        const formElem = event.target as HTMLFormElement;
        const isValid = formElem.checkValidity();
        if (!isValid) {
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

        await appendExpences(values);
    }


    return <form className={(state.wasValidate ? 'was-validated' : 'needs-validation') + ' col-xxl-3 col-xl-4 col-lg-5 col-md-6 col-sm-7 col-12'}
            onSubmit={onSubmit}
            noValidate>

            <h3>Add an expense</h3>

            <div className='input-group mb-3'>
                <input type="date"
                    name={ExpenseFormField.date}
                    required
                    className="form-control"
                    placeholder="Date" />
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
                {homeFinanceData!.expenseCategories.map(category =>
                    <option key={category.name}>{category.name}</option>
                )}
            </select>

            <select defaultValue=''
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
                className="btn btn-dark ms-auto d-block">Save
            </button>
        </form>
}

export default AddExpensePage;