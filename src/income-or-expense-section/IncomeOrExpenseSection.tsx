import * as Papa from 'papaparse';
import { useState } from 'react';
import { GSExpenseOrIncomeCsvRow } from '../model';

export const IncomeOrExpenseSection: React.FC<{
  title: string;
  records: GSExpenseOrIncomeCsvRow[];
  onCopy: (rows: string[][]) => Promise<any>;
  onDeleteRecord: (record: GSExpenseOrIncomeCsvRow) => void;
  onDeleteRecordAnBelow: (
    index: number,
    records: GSExpenseOrIncomeCsvRow[],
  ) => void;
}> = ({ title, records, onCopy, onDeleteRecord, onDeleteRecordAnBelow }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  function copyToClipboard(records: GSExpenseOrIncomeCsvRow[]) {
    const csvString = Papa.unparse(records, {
      header: false,
      skipEmptyLines: true,
      delimiter: ',',
    });
    navigator.clipboard.writeText(csvString);
  }

  async function copyToGS(records: GSExpenseOrIncomeCsvRow[]) {
    setIsProcessing(true);
    const rows = [];
    for (const record of records) {
      const { amount, currency, account, category, date, description } = record;
      rows.push([
        `${amount}`,
        currency,
        account,
        category || '',
        date,
        description || '',
      ]);
    }
    try {
      await onCopy(rows);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section>
      {isProcessing ? (
        <h5>Processing...</h5>
      ) : (
        <h5>
          {title} ({records.filter((x) => !x.category).length}/{records.length})
          <button
            type="button"
            className="btn btn-primary btn-clipboard"
            onClick={() => copyToClipboard(records)}
            data-bs-original-title="Copy to clipboard"
          >
            Copy
          </button>
          <button
            type="button"
            className="btn btn-primary btn-clipboard"
            disabled={isProcessing}
            onClick={() => copyToGS(records)}
            data-bs-original-title="Move records to google sheets"
          >
            To GS
          </button>
        </h5>
      )}
      <table className="table record-table">
        <thead>
          <tr>
            <th scope="col">Account</th>
            <th scope="col">Category</th>
            <th scope="col">Amount</th>
            <th scope="col">Date</th>
            <th scope="col"></th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <tr key={index} className={record.category ? '' : 'table-warning'}>
              <td>{record.account}</td>
              <td>
                <p className="fs-4 text-nowrap m-0">{record.category}</p>
                <p className="fs-6 m-0 text-secondary break-anywhere">
                  {record.description}
                </p>
              </td>
              <td className="text-end text-nowrap">
                {record.amount} {record.currency}
              </td>
              <td className="text-nowrap">{record.date}</td>
              <td className="text-nowrap">
                <button
                  type="button"
                  className="btn btn-light bg-warning"
                  onClick={() => onDeleteRecord?.(record)}
                >
                  <i className="bi bi-x"></i>
                </button>
                <button
                  type="button"
                  className="btn btn-light bg-danger"
                  onClick={() => onDeleteRecordAnBelow?.(index, records)}
                >
                  <i className="bi bi-arrow-down"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};
