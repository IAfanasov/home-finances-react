import React, { useState } from "react";
import { GSExpenseOrIncomeCsvRow } from "../model";
import * as Papa from "papaparse";
import { appendExpences } from '../google-sheets/appendExpences';

export function IncomeOrExpenseSection(props: { title: string, records: GSExpenseOrIncomeCsvRow[] }) {

    const [isProcessing, setIsProcessing] = useState(false);
    const [total, setTotal] = useState(0);
    const [processing, setProcessing] = useState(0);

    function copyToClipboard(records: GSExpenseOrIncomeCsvRow[]) {
        const csvString = Papa.unparse(records, { header: false, skipEmptyLines: true, delimiter: ',' });
        navigator.clipboard.writeText(csvString);
    }

    async function copyToGS(records: GSExpenseOrIncomeCsvRow[]) {
        setIsProcessing(true);
        setProcessing(0);
        setTotal(records.length);
        for (const { amount, currency, account, category, date, description } of records) {
            setProcessing((prev) => prev + 1);
            const row = [`${amount}`, currency, account, category || '', date, description || ''];
            await appendExpences([row]);
        };
        setIsProcessing(false);
    }

    return <section>
        {isProcessing && <h5>Processing {processing} out of {total}</h5>}
        <h5>{props.title} ({props.records.filter(x => !x.category).length}/{props.records.length})
            <button type="button"
                className="btn btn-primary btn-clipboard"
                onClick={() => copyToClipboard(props.records)}
                data-bs-original-title="Copy to clipboard">Copy</button>
            <button type="button"
                className="btn btn-primary btn-clipboard"
                onClick={() => copyToGS(props.records)}
                data-bs-original-title="Move records to google sheets">To GS</button>
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
                {props.records.map((record, index) =>
                    <tr key={index} className={record.category ? '' : 'table-warning'}>
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