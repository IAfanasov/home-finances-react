import { FormEvent, useContext, useState } from "react";
import './AddExpenseForm.css';
import { HomeFinanceDataContext } from "../shared/data-context";


enum ExpenseFormField {
    amount = 'amount',
    currency = 'currency',
    date = 'date',
    category = 'category',
    account = 'account',
    comment = 'comment',
}

export function AddExpensePage() {
    const initialState: { wasValidate: boolean } = {wasValidate: false};
    const [state, setState] = useState(initialState);
    const {data: homeFinanceData} = useContext(HomeFinanceDataContext);

    async function onSubmit(event: FormEvent) {
        setState(current => ({...current, wasValidate: true}));
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

        await appendValues(values);
    }

    async function appendValues(values: string[][]): Promise<any> {

        const sheetId = process.env.REACT_APP_EXPENSES_SHEET_ID;

        // Insert a row and copy and paste existing row
        const newRowRequestBody: gapi.client.sheets.BatchUpdateSpreadsheetRequest = {
            requests: [{
                insertDimension: {
                    inheritFromBefore: true,
                    range: {
                        dimension: 'ROWS',
                        endIndex: 2,
                        sheetId,
                        startIndex: 1,
                    }
                },
            }, {
                copyPaste: {
                    source: {
                        sheetId,
                        startRowIndex: 3,
                        endRowIndex: 4,
                        startColumnIndex: 0,
                        endColumnIndex: 8,
                    },
                    destination: {
                        sheetId,
                        startRowIndex: 1,
                        endRowIndex: 2,
                        startColumnIndex: 0,
                        endColumnIndex: 8,
                    },
                    pasteType: 'PASTE_NORMAL',
                }
            }],
        }
        await gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.REACT_APP_SPREADSHEET_ID,
        }, newRowRequestBody);

        // Update row values
        const valuesUpdateBody: gapi.client.sheets.BatchUpdateValuesRequest = {
            valueInputOption: 'USER_ENTERED',
            data: [{
                range: `expense!C2:H2`,
                values,
            }],
        }
        await gapi.client.sheets.spreadsheets.values.batchUpdate({spreadsheetId: process.env.REACT_APP_SPREADSHEET_ID}, valuesUpdateBody)

        // copy paste converted to eur value
        const copyPasteCalculatedValue: gapi.client.sheets.BatchUpdateSpreadsheetRequest = {
            requests: [{
                copyPaste: {
                    source: {
                        sheetId,
                        startRowIndex: 1,
                        endRowIndex: 2,
                        startColumnIndex: 1,
                        endColumnIndex: 2,
                    },
                    destination: {
                        sheetId,
                        startRowIndex: 1,
                        endRowIndex: 2,
                        startColumnIndex: 0,
                        endColumnIndex: 1,
                    },
                    pasteType: 'PASTE_VALUES',
                }
            }],
        }
        await gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.REACT_APP_SPREADSHEET_ID,
        }, copyPasteCalculatedValue);
    }


    return homeFinanceData &&
        <form className={(state.wasValidate ? 'was-validated' : 'needs-validation') + ' col-xxl-3 col-xl-4 col-lg-5 col-md-6 col-sm-7 col-12'}
              onSubmit={onSubmit}
              noValidate>

            <h3>Add an expense</h3>

            <div className='input-group mb-3'>
                <input type="date"
                       name={ExpenseFormField.date}
                       required
                       className="form-control"
                       placeholder="Date"/>
            </div>
            
            <div className='input-group mb-3'>
                <input type="number"
                       min={0}
                       step={0.01}
                       className="form-control"
                       required
                       name={ExpenseFormField.amount}
                       placeholder="Amount"/>
                <select className="currency-select form-select flex-grow-0 flex-shrink-0"
                        name={ExpenseFormField.currency}>
                    {homeFinanceData.currencies.map(currency =>
                        <option key={currency}>{currency}</option>
                    )}
                </select>
            </div>

            <select defaultValue=''
                    required
                    name={ExpenseFormField.category}
                    className="form-select mb-3">
                <option value="">Select a category</option>
                {homeFinanceData.expenseCategories.map(category =>
                    <option key={category}>{category}</option>
                )}
            </select>

            <select defaultValue=''
                    required
                    name={ExpenseFormField.account}
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
                          name={ExpenseFormField.comment}
                          rows={2}></textarea>
            </div>

            <button type='submit'
                    className="btn btn-dark ms-auto d-block">Save
            </button>
        </form>
}

export default AddExpensePage;