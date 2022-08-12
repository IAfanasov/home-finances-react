import { FormEvent, useState } from "react";
import './AddExpenseForm.css';

export function AddExpensePage() {
    const [state, setState] = useState({wasValidate: false});

    function onSubmit(event: FormEvent) {
        setState({wasValidate: true});
        console.log(event);
    }

    return <form className={(state.wasValidate ? 'was-validated' : 'needs-validation') + ' col-xxl-3 col-xl-4 col-lg-5 col-md-6 col-sm-7 col-12'}
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
                <option>EUR</option>
                <option>USD</option>
                <option>RUB</option>
            </select>
            <input type="date"
                   required
                   className="form-control"
                   placeholder="Date"/>
        </div>

        <select defaultValue=''
                required
                className="form-select mb-3">
            <option value="">Category</option>
            <option value="1">One</option>
            <option value="2">Two</option>
            <option value="3">Three</option>
        </select>

        <select defaultValue=''
                required
                className="form-select mb-3">
            <option value="">Account</option>
            <option value="1">One</option>
            <option value="2">Two</option>
            <option value="3">Three</option>
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