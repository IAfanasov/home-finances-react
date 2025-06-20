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
            disabled={isProcessing}
            onClick={() => copyToGS(records)}
            data-bs-original-title="Move records to google sheets"
          >
            To GS
          </button>
        </h5>
      )}
      <table className="table record-table">
        <tbody>
          {records.map((record, index) => {
            const isWarning = !record.fromAccount || !record.toAccount;
            return (
              <tr key={record.id}>
                <td colSpan={5} style={{ padding: 0, borderBottom: '1px solid #dee2e6', background: 'transparent' }}>
                  <div
                    className={`record-grid-row${record.duplicate ? ' bg-danger-subtle' : isWarning ? ' bg-warning-subtle' : ''}`}
                    style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr auto', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.5rem 0 0.5rem' }}
                  >
                    <div>
                      <select
                        value={record.fromAccount}
                        className="form-select mb-0"
                        style={{ minWidth: '120px' }}
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
                    </div>
                    <div>
                      <select
                        value={record.toAccount}
                        className="form-select mb-0"
                        style={{ minWidth: '120px' }}
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
                    </div>
                    <div className="text-end text-nowrap">
                      {record.amount} {record.currency}
                    </div>
                    <div className="text-nowrap">
                      <time title={record.date} dateTime={record.date}>
                        {record.date.split(' ')[0]}
                      </time>
                    </div>
                    <div className="text-nowrap d-flex gap-1">
                      <button
                        type="button"
                        className="btn btn-light bg-warning btn-sm"
                        onClick={() => onDeleteRecord?.(record)}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-light bg-danger btn-sm"
                        onClick={() => onDeleteRecordAnBelow?.(index, records)}
                      >
                        <i className="bi bi-arrow-down"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-light bg-info btn-sm"
                        title="Transform to expense"
                        onClick={() => onTransformToExpense(record)}
                      >
                        <i className="bi bi-arrow-left-right"></i>
                      </button>
                    </div>
                    <div className="fs-6 text-secondary break-anywhere" style={{ fontSize: '0.85em', gridColumn: '1 / -1', paddingTop: 0 }}>
                      {record.description || '\u00A0'}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}; 