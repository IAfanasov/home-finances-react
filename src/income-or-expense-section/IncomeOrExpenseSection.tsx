import * as Papa from 'papaparse';
import { useMemo, useState } from 'react';
import { CategoryData, GSExpenseOrIncomeCsvRow } from '../model';

export const IncomeOrExpenseSection: React.FC<{
  title: string;
  records: GSExpenseOrIncomeCsvRow[];
  categories: CategoryData[];
  onCopy: (rows: string[][]) => Promise<any>;
  onDeleteRecord: (record: GSExpenseOrIncomeCsvRow) => void;
  onRecordUpdate: (
    record: GSExpenseOrIncomeCsvRow,
    newRecord: GSExpenseOrIncomeCsvRow,
  ) => void;
  onDeleteRecordAnBelow: (
    index: number,
    records: GSExpenseOrIncomeCsvRow[],
  ) => void;
}> = ({
  title,
  records,
  categories,
  onCopy,
  onDeleteRecord,
  onDeleteRecordAnBelow,
  onRecordUpdate,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  async function copyToGS(records: GSExpenseOrIncomeCsvRow[]) {
    setIsProcessing(true);
    const rows = [];
    for (const record of records) {
      if (record.duplicate) {
        continue;
      }
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

  const nonDuplicateRecords = useMemo(
    () => records.filter((x) => !x.duplicate),
    [records],
  );
  const emptyCategoryRecords = useMemo(
    () => nonDuplicateRecords.filter((x) => !x.category),
    [nonDuplicateRecords],
  );

  return (
    <section>
      {isProcessing ? (
        <h5>Processing...</h5>
      ) : (
        <h5>
          {title} ({emptyCategoryRecords.length}/{nonDuplicateRecords.length})
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
          {records.map((record, index) => (
            <tr
              key={record.id}
            >
              <td colSpan={5} style={{ padding: 0, borderBottom: '1px solid #dee2e6', background: 'transparent' }}>
                <div
                  className={`record-grid-row${record.duplicate ? ' bg-danger-subtle' : !record.category ? ' bg-warning-subtle' : ''}`}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr auto', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.5rem 0 0.5rem' }}
                >
                  <div>{record.account}</div>
                  <div>
                    <select
                      value={record.category}
                      className="form-select mb-0"
                      style={{ minWidth: 120 }}
                      onChange={(e) =>
                        onRecordUpdate(record, {
                          ...record,
                          category: e.target.value,
                        })
                      }
                    >
                      <option key={''}></option>
                      {categories.map((cat) => (
                        <option value={cat.name} key={cat.name}>
                          {cat.name}
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
                  </div>
                  <div className="fs-6 text-secondary break-anywhere" style={{ fontSize: '0.85em', gridColumn: '1 / -1', paddingTop: 0 }}>
                    {record.description || '\u00A0'}
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

/* Add this to your CSS or a style block:
.record-grid-row {
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr 1fr auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem 0 0.5rem;
}
*/
