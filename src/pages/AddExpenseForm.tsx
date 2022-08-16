import { FormEvent, useContext, useState } from "react";
import './AddExpenseForm.css';
import { HomeFinanceDataContext } from "../shared/data-context";

export function AddExpensePage() {
    const [state, setState] = useState({wasValidate: false});
    const {data: homeFinanceData} = useContext(HomeFinanceDataContext);

    function onSubmit(event: FormEvent) {
        setState({wasValidate: true});
        console.log(event);
        event.preventDefault();
    }


    return homeFinanceData &&
        <form className={(state.wasValidate ? 'was-validated' : 'needs-validation') + ' col-xxl-3 col-xl-4 col-lg-5 col-md-6 col-sm-7 col-12'}
              onSubmit={onSubmit}
              noValidate>

            <h3>Add an expense</h3>

            <div className='input-group mb-3'>
                <input type="number"
                       min={0}
                       step={0.01}
                       className="form-control"
                       required
                       placeholder="Amount"/>
                <select className="currency-select form-select flex-grow-0 flex-shrink-0">
                    {homeFinanceData.currencies.map(currency =>
                        <option key={currency}>{currency}</option>
                    )}
                </select>
                <input type="date"
                       required
                       className="form-control"
                       placeholder="Date"/>
            </div>

            <select defaultValue=''
                    required
                    className="form-select mb-3">
                <option value="">Select a category</option>
                {homeFinanceData.expenseCategories.map(category =>
                    <option key={category}>{category}</option>
                )}
            </select>

            <select defaultValue=''
                    required
                    className="form-select mb-3">
                <option value="">Select an account</option>
                {homeFinanceData.accounts.map(account =>
                    <option key={account}>{account}</option>
                )}
            </select>

            <div className="mb-3">
                <label htmlFor="inputComment"
                       className="form-label">Comment</label>
                <textarea className="form-control"
                          id="inputComment"
                          rows={2}></textarea>
            </div>

            <button type='submit'
                    className="btn btn-dark ms-auto d-block">Save
            </button>
        </form>
}

export default AddExpensePage;