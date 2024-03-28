import { useCallback, useContext, useEffect, useState } from 'react';
import { processAbn } from '../abn/abn';
import { AbnCsvRow } from '../abn/model';
import { appendExpensesOrIncome } from '../google-sheets/appendExpensesOrIncome';
import { IncomeOrExpenseSection } from '../income-or-expense-section/IncomeOrExpenseSection';
import {
  BankStatementProcessingResult,
  GSExpenseOrIncomeCsvRow,
  RevolutCsvRow,
} from '../model';
import { processRevolut } from '../revolut/revolut';
import { HomeFinanceDataContext } from '../shared/data-context';

function CsvExport() {
  const initialState: BankStatementProcessingResult<AbnCsvRow | RevolutCsvRow> =
    {
      expenses: [],
      incomes: [],
      empty: [],
      manual: [],
    };
  const [isSucceed, setIsSucceed] = useState(true);
  const [parseError, setParseError] = useState(null);
  const [state, setState] = useState(initialState);
  const [rawText, setRawText] = useState('');
  const { data: homeFinanceData } = useContext(HomeFinanceDataContext);

  useEffect(() => {
    async function processNewText() {
      try {
        let result: BankStatementProcessingResult<AbnCsvRow | RevolutCsvRow>;
        if (rawText.split('\t').length > 3) {
          result = processAbn(rawText, homeFinanceData!);
        } else {
          result = processRevolut(rawText, homeFinanceData!);
        }
        setIsSucceed(true);
        setParseError(null);
        setState({
          expenses: result.expenses,
          incomes: result.incomes,
          empty: result.empty,
          manual: result.manual,
        });
      } catch (err: any) {
        setIsSucceed(false);
        setParseError(err?.toString());
      }
    }
    processNewText();
  }, [rawText, homeFinanceData, setState, setIsSucceed, setParseError]);

  const onDeleteRecord = useCallback(
    (record: GSExpenseOrIncomeCsvRow) => {
      setRawText((prevVal) => {
        return prevVal
          .split('\n')
          .filter((_, index) => index !== record.rowIndex)
          .join('\n');
      });
    },
    [setRawText],
  );

  const onDeleteRecordAnBelow = useCallback(
    (index: number, records: GSExpenseOrIncomeCsvRow[]) => {
      const recordsToDelete = records
        .slice(index)
        .map((record) => record.rowIndex);
      setRawText((prevVal) => {
        return prevVal
          .split('\n')
          .filter((_, index) => !recordsToDelete.includes(index))
          .join('\n');
      });
    },
    [setRawText],
  );

  const deleteDuplicates = useCallback(() => {
    const recordsToDelete = state.expenses
      .filter((record) => record.duplicate)
      .map((record) => record.rowIndex);
    setRawText((prevVal) => {
      return prevVal
        .split('\n')
        .filter((_, index) => !recordsToDelete.includes(index))
        .join('\n');
    });
  }, [setRawText, state.expenses]);

  return (
    <div className="p-3">
      <textarea
        className="form-control mb-2"
        rows={10}
        value={rawText}
        onChange={(newVal) => setRawText(newVal.target.value)}
      ></textarea>

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

      <div className="d-flex gap-5">
        <IncomeOrExpenseSection
          title={'Expenses'}
          records={state.expenses}
          onCopy={(rows) =>
            appendExpensesOrIncome(
              rows,
              process.env.REACT_APP_EXPENSES_SHEET_ID,
              'expense',
            )
          }
          onDeleteRecord={onDeleteRecord}
          onDeleteRecordAnBelow={onDeleteRecordAnBelow}
        />
        <IncomeOrExpenseSection
          title={'Incomes'}
          records={state.incomes}
          onCopy={(rows) =>
            appendExpensesOrIncome(
              rows,
              process.env.REACT_APP_INCOME_SHEET_ID,
              'Income',
            )
          }
          onDeleteRecord={onDeleteRecord}
          onDeleteRecordAnBelow={onDeleteRecordAnBelow}
        />
      </div>
      <h5>Manual ({state.manual.length})</h5>
      <pre className="p-3">{JSON.stringify(state.manual, null, 4)}</pre>
      <h5>Empty ({state.empty.length})</h5>
      <pre className="p-3">{JSON.stringify(state.empty, null, 4)}</pre>
    </div>
  );
}

export default CsvExport;
