import React from "react";
import { GSExpenseOrIncomeCsvRow } from "../model";
import * as Papa from "papaparse";

export function IncomeOrExpenseSection(props: { title: string, records: GSExpenseOrIncomeCsvRow[] }) {

    function copyToClipboard(records: GSExpenseOrIncomeCsvRow[]) {
        const csvString = Papa.unparse(records, {header: false, skipEmptyLines: true, delimiter: ','});
        navigator.clipboard.writeText(csvString);
    }

    return <section>
        <h5>{props.title} ({props.records.length})
            <button type="button"
                    className="btn btn-primary btn-clipboard"
                    onClick={() => copyToClipboard(props.records)}
                    data-bs-original-title="Copy to clipboard">Copy</button>
        </h5>
        <table className="table record-table">
            <thead>
            <tr>
                <th scope="col">Account</th>
                <th scope="col">Category</th>
                <th scope="col">Amount</th>
                <th scope="col">Date</th>
            </tr>
            </thead>
            <tbody>
            {props.records.map((record) =>
                <tr className={record.category ? '' : 'table-warning'}>
                    <td>{record.account}</td>
                    <td>
                        <p className='fs-4 text-nowrap m-0'>{record.category}</p>
                        <p className='fs-6 m-0 text-secondary break-anywhere'>{record.description}</p>
                    </td>
                    <td className='text-end text-nowrap'>{record.amount} {record.currency}</td>
                    <td className='text-nowrap'>{record.date}</td>
                </tr>
            )}
            </tbody>
        </table>

    </section>
}