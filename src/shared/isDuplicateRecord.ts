import { GSExpenseOrIncomeCsvRow, GSTransferCsvRow } from '../model';

export function isDuplicateExpenseOrIncome(
  newRecord: GSExpenseOrIncomeCsvRow,
  existingRecords: GSExpenseOrIncomeCsvRow[],
): boolean {
  return existingRecords.some(
    (record) =>
      record.amount === newRecord.amount &&
      record.date === newRecord.date &&
      record.account === newRecord.account &&
      record.category === newRecord.category &&
      record.description === newRecord.description
  );
}

export function isDuplicateTransfer(
  newRecord: GSTransferCsvRow,
  existingRecords: GSTransferCsvRow[],
): boolean {
  return existingRecords.some(
    (record) =>
      record.amount === newRecord.amount &&
      record.date === newRecord.date &&
      record.fromAccount === newRecord.fromAccount &&
      record.toAccount === newRecord.toAccount &&
      record.currency === newRecord.currency &&
      record.description === newRecord.description
  );
}