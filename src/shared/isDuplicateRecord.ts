import { GSExpenseOrIncomeCsvRow, ResultCsvRow } from '../model';

export function isDuplicateRecord(
  gsFeeRecord: GSExpenseOrIncomeCsvRow,
  topExpenseRecords: ResultCsvRow[],
): boolean {
  return topExpenseRecords.some(
    (record) =>
      record.expensesAmount === gsFeeRecord.amount &&
      record.date === gsFeeRecord.date &&
      record.account === gsFeeRecord.account,
  );
}
