import * as Papa from 'papaparse';
import { useMemo, useState } from 'react';
import { GSTransferCsvRow } from '../model';

export const TransferSection: React.FC<{
  title: string;
  records: GSTransferCsvRow[];
  accounts: string[];
  onCopy: (rows: string[][]) => Promise<any>;
  onDeleteRecord: (record: GSTransferCsvRow) => void;
  onRecordUpdate: (
    record: GSTransferCsvRow,
    newRecord: GSTransferCsvRow,
  ) => void;
  onDeleteRecordAnBelow: (
    index: number,
    records: GSTransferCsvRow[],
  ) => void;
  onTransformToExpense: (record: GSTransferCsvRow) => void;
}> = ({
  title,
  records,
  accounts,
  onCopy,
  onDeleteRecord,
  onDeleteRecordAnBelow,
  onRecordUpdate,
  onTransformToExpense,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  function copyToClipboard(records: GSTransferCsvRow[]) {
    const csvString = Papa.unparse(records, {
      header: false,
      skipEmptyLines: true,
      delimiter: ',',
    });
    navigator.clipboard.writeText(csvString);
  }

  async function copyToGS(records: GSTransferCsvRow[]) {
    setIsProcessing(true);
    const rows = [];
    for (const record of records) {
      if (record.duplicate) {
        continue;
      }
      const { amount, currency, fromAccount, toAccount, date, description } = record;
      rows.push([
        `${amount}`,
        currency,
        fromAccount,
        toAccount,
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

  const nonDuplicateRecords = useMemo(
    () => records.filter((x) => !x.duplicate),
    [records],
  );

  return (
    <section>
      {isProcessing ? (
        <h5>Processing...</h5>
      ) : (
        <h5>
          {title} ({nonDuplicateRecords.length})
          <button
            type="button"
            className="btn btn-primary btn-clipboard"
            onClick={() => copyToClipboard(records)}
            data-bs-original-title="Copy to clipboard"
            style={{ marginRight: '10px' }}
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
            <th scope="col">From Account</th>
            <th scope="col">To Account</th>
            <th scope="col">Amount</th>
            <th scope="col">Date</th>
            <th scope="col"></th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <>
              <tr
                key={record.id}
                className={record.duplicate ? 'table-danger' : ''}
              >
                <td>
                  <select
                    value={record.fromAccount}
                    className="form-select mb-3"
                    style={{ minWidth: '200px' }}
                    onChange={e =>
                      onRecordUpdate(record, {
                        ...record,
                        fromAccount: e.target.value,
                      })
                    }
                  >
                    <option key={''}></option>
                    {accounts.map((acc) => (
                      <option value={acc} key={acc}>
                        {acc}
                      </option>
                    ))}
                  </select>
                  {record.description && (
                    <div className="fs-6 text-secondary break-anywhere" style={{ fontSize: '0.85em' }}>
                      {record.description}
                    </div>
                  )}
                </td>
                <td>
                  <select
                    value={record.toAccount}
                    className="form-select mb-3"
                    style={{ minWidth: '200px' }}
                    onChange={e =>
                      onRecordUpdate(record, {
                        ...record,
                        toAccount: e.target.value,
                      })
                    }
                  >
                    <option key={''}></option>
                    {accounts.map((acc) => (
                      <option value={acc} key={acc}>
                        {acc}
                      </option>
                    ))}
                  </select>
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
                  <button
                    type="button"
                    className="btn btn-light bg-info"
                    title="Transform to expense"
                    onClick={() => onTransformToExpense(record)}
                  >
                    <i className="bi bi-arrow-left-right"></i>
                  </button>
                </td>
              </tr>
            </>
          ))}
        </tbody>
      </table>
    </section>
  );
}; 