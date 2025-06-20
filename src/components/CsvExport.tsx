import React, { useCallback, useContext, useState } from 'react';
import { processAbn } from '../abn/abn';
import { AbnCsvRow } from '../abn/model';
import { appendExpensesOrIncome } from '../google-sheets/appendExpensesOrIncome';
import { appendTransfers } from '../google-sheets/appendTransfers';
import { IncomeOrExpenseSection } from '../income-or-expense-section/IncomeOrExpenseSection';
import { TransferSection } from '../transfer-section/TransferSection';
import {
  BankStatementProcessingResult,
  GSExpenseOrIncomeCsvRow,
  GSTransferCsvRow,
  RevolutCsvRow,
} from '../model';
import { processRevolut } from '../revolut/revolut';
import { HomeFinanceDataContext } from '../shared/data-context';
import { parseTrPdfStatement } from '../tr/tr';
import { getCategory } from '../shared/category-utils';

type TCSVRow = AbnCsvRow | RevolutCsvRow;

function CsvExport() {
  const [isSucceed, setIsSucceed] = useState(true);
  const [parseError, setParseError] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<GSExpenseOrIncomeCsvRow[]>([]);
  const [incomes, setIncomes] = useState<GSExpenseOrIncomeCsvRow[]>([]);
  const [emptyRecords, setEmptyRecords] = useState<TCSVRow[]>([]);
  const [manualRecords, setManualRecords] = useState<TCSVRow[]>([]);
  const [transfers, setTransfers] = useState<GSTransferCsvRow[]>([]);
  const { data: homeFinanceData } = useContext(HomeFinanceDataContext);

  const onDeleteRecord = useCallback(
    (record: GSExpenseOrIncomeCsvRow) => {
      setExpenses((prev) => prev.filter((x) => x.id !== record.id));
    },
    [setExpenses],
  );

  const onDeleteRecordAnBelow = useCallback(
    (index: number, records: GSExpenseOrIncomeCsvRow[]) => {
      const recordsToDelete = new Set(
        records.slice(index).map((record) => record.id),
      );
      setExpenses((prev) => prev.filter((x) => !recordsToDelete.has(x.id)));
    },
    [setExpenses],
  );

  const onDeleteTransferRecord = useCallback(
    (record: GSTransferCsvRow) => {
      setTransfers((prev) => prev.filter((x) => x.id !== record.id));
    },
    [setTransfers],
  );

  const onDeleteTransferRecordAnBelow = useCallback(
    (index: number, records: GSTransferCsvRow[]) => {
      const recordsToDelete = new Set(
        records.slice(index).map((record) => record.id),
      );
      setTransfers((prev) => prev.filter((x) => !recordsToDelete.has(x.id)));
    },
    [setTransfers],
  );

  const onTransferRecordUpdate = useCallback(
    (oldRecord: GSTransferCsvRow, newRecord: GSTransferCsvRow) => {
      setTransfers((prev) =>
        prev.map((record) =>
          record.rowIndex === oldRecord.rowIndex ? newRecord : record,
        ),
      );
    },
    [setTransfers],
  );

  const deleteDuplicates = useCallback(() => {
    setExpenses((prev) => prev.filter((x) => !x.duplicate));
  }, [setExpenses]);

  const onTransformTransferToExpense = useCallback(
    (transfer: GSTransferCsvRow) => {
      setTransfers((prev) => prev.filter((x) => x.id !== transfer.id));
      setExpenses((prev) => {
        const newExpense = {
          id: `manual-expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          amount: Math.abs(transfer.amount),
          currency: transfer.currency,
          account: transfer.fromAccount,
          category: homeFinanceData ? getCategory({ amount: -Math.abs(transfer.amount), description: transfer.description || '' }, homeFinanceData) : undefined,
          date: transfer.date,
          description: transfer.description,
          rowIndex: transfer.rowIndex,
        };
        return [...prev, newExpense].sort((a, b) => b.date.localeCompare(a.date));
      });
    },
    [setTransfers, setExpenses, homeFinanceData],
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }
    console.log('Selected file:', file.name);
    const reader = new FileReader();
    reader.onload = async function (e: ProgressEvent<FileReader>) {
      const content = e.target?.result as ArrayBuffer;
      console.log('File content loaded, length:', content.byteLength);
      try {
        let result: BankStatementProcessingResult<AbnCsvRow | RevolutCsvRow>;
        if (file.name.toLocaleLowerCase().endsWith('.csv')) {
          const text = new TextDecoder('utf-8').decode(content);
          result = processRevolut(text, homeFinanceData!);
        } else if (file.name.toLocaleLowerCase().endsWith('.tab')) {
          const text = new TextDecoder('utf-8').decode(content);
          result = processAbn(text, homeFinanceData!);
        } else {
          result = await parseTrPdfStatement(content, homeFinanceData!);
        }
        setExpenses(result.expenses);
        setIncomes(result.incomes);
        setEmptyRecords(result.empty);
        setManualRecords(result.manual);
        setTransfers(result.transfers);
        setIsSucceed(true);
        setParseError(null);
      } catch (error) {
        console.error('Error parsing PDF:', error);
        setIsSucceed(false);
        setParseError('Error parsing PDF: ' + (error as Error).message);
      }
    };
    reader.onerror = function (e) {
      console.error('Error reading file:', e);
      setIsSucceed(false);
      setParseError('Error reading file');
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="p-3">
      <label htmlFor="fileInput" className="form-label">
        Upload Statement
      </label>
      <input
        type="file"
        className="form-control"
        id="fileInput"
        accept=".pdf, .csv, .tab"
        onChange={handleFileSelect}
        onClick={(e) => ((e.target as HTMLInputElement).value = '')}
      />
      <button
        type="button"
        className="btn btn-primary mb-4"
        onClick={deleteDuplicates}
      >
        Delete dups
      </button>

      {isSucceed ? (
        <div>
          <i className="bi bi-check-circle text-success"></i> Success
        </div>
      ) : (
        <div>
          <i className="bi bi-x-circle text-danger pr-1"></i> {parseError}
        </div>
      )}

      <div className="d-flex gap-5 align-items-start">
        <div style={{ flex: 1 }}>
          <IncomeOrExpenseSection
            title={'Expenses'}
            records={expenses}
            categories={homeFinanceData?.expenseCategories || []}
            onCopy={(rows) =>
              appendExpensesOrIncome(
                rows,
                process.env.REACT_APP_EXPENSES_SHEET_ID,
                'expense',
              )
            }
            onDeleteRecord={onDeleteRecord}
            onDeleteRecordAnBelow={onDeleteRecordAnBelow}
            onRecordUpdate={(oldRecord, newRecord) => {
              setExpenses((prev) =>
                prev.map((record) =>
                  record.rowIndex === oldRecord.rowIndex ? newRecord : record,
                ),
              );
            }}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <IncomeOrExpenseSection
            title={'Incomes'}
            records={incomes}
            categories={homeFinanceData?.incomeCategories || []}
            onCopy={(rows) =>
              appendExpensesOrIncome(
                rows,
                process.env.REACT_APP_INCOME_SHEET_ID,
                'Income',
              )
            }
            onDeleteRecord={onDeleteRecord}
            onDeleteRecordAnBelow={onDeleteRecordAnBelow}
            onRecordUpdate={(oldRecord, newRecord) => {
              setIncomes((prev) =>
                prev.map((record) =>
                  record.rowIndex === oldRecord.rowIndex ? newRecord : record,
                ),
              );
            }}
          />
          <TransferSection
            title={'Transfers'}
            records={transfers}
            accounts={homeFinanceData?.accounts || []}
            onCopy={(rows) =>
              appendTransfers(
                rows,
                process.env.REACT_APP_TRANSFERS_SHEET_ID,
                'Transfer',
              )
            }
            onDeleteRecord={onDeleteTransferRecord}
            onDeleteRecordAnBelow={onDeleteTransferRecordAnBelow}
            onRecordUpdate={onTransferRecordUpdate}
            onTransformToExpense={onTransformTransferToExpense}
          />
        </div>
      </div>

      <h5>Manual ({manualRecords.length})</h5>
      <pre className="p-3">{JSON.stringify(manualRecords, null, 4)}</pre>
      <h5>Empty ({emptyRecords.length})</h5>
      <pre className="p-3">{JSON.stringify(emptyRecords, null, 4)}</pre>
    </div>
  );
}

export default CsvExport;
