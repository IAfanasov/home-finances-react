export function AddExpensePage() {
    return <form className='col-xxl-3 col-xl-4 col-lg-5 col-md-6 col-sm-7 col-12'>
        <h3>Add an expense</h3>

        <div className='input-group mb-3'>
            <input type="number"
                   className="form-control"
                   placeholder="Amount"/>
            <button className="btn btn-outline-secondary dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false">Dropdown
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
                <li><a className="dropdown-item"
                       href="#">Action</a></li>
                <li><a className="dropdown-item"
                       href="#">Another action</a></li>
                <li><a className="dropdown-item"
                       href="#">Something else here</a></li>
            </ul>
            <input type="date"
                   className="form-control"
                   placeholder="Date"/>
        </div>

        <select defaultValue=''
                className="form-select mb-3">
            <option value="">Category</option>
            <option value="1">One</option>
            <option value="2">Two</option>
            <option value="3">Three</option>
        </select>

        <select defaultValue=''
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

        <button className="btn btn-dark ms-auto d-block">Save</button>
    </form>
}

export default AddExpensePage;