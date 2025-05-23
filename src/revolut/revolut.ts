import * as Papa from 'papaparse';
import {
  BankStatementProcessingResult,
  GSExpenseOrIncomeCsvRow,
  HomeFinanceData,
  RevolutCsvRow,
} from '../model';
import { getCategory } from '../shared/category-utils';
import { isDuplicateRecord } from '../shared/isDuplicateRecord';

export function processRevolut(
  csvString: string,
  data: HomeFinanceData,
): BankStatementProcessingResult<RevolutCsvRow> {
  console.log(`Processing revolut`);
  try {
    const records = getRevolutRecords(csvString);
    console.log(`Processing ${records.length} parsed records`);
    const incomes: GSExpenseOrIncomeCsvRow[] = [];
    const empty: RevolutCsvRow[] = [];
    const manual: RevolutCsvRow[] = [];
    const expenses: GSExpenseOrIncomeCsvRow[] = [];
    for (const revolutRecord of records) {
      const amount = +revolutRecord.amount;
      const { description, recordType } = revolutRecord;
      if (
        recordType === 'ATM' ||
        description.indexOf('Payment from I Afanasov Cj') >= 0
      ) {
        manual.push(revolutRecord);
        continue;
      }
      if (
        recordType === 'TRANSFER' ||
        description.indexOf('Savings vault') >= 0
      ) {
        manual.push(revolutRecord);
        continue;
      }
      if (amount === 0) {
        // 0.00 === 0 is false for some reason
        empty.push(revolutRecord);
      } else {
        const gsRecord: GSExpenseOrIncomeCsvRow = {
          id: 'temp',
          amount: Math.abs(amount),
          currency: revolutRecord.currency,
          account: 'Revolut',
          category: getCategory({ amount, description }, data),
          date: revolutRecord.startedDate,
          description,
          rowIndex: revolutRecord.rowIndex,
        };

        const fee = +revolutRecord.fee;
        if (fee) {
          const gsFeeRecord: GSExpenseOrIncomeCsvRow = {
            id: `revolut-fee-${expenses.length.toString()}`,
            amount: fee,
            currency: revolutRecord.currency,
            account: 'Revolut',
            category: 'Bank service',
            date: revolutRecord.startedDate,
            description: `Fee for ${description}`,
            rowIndex: revolutRecord.rowIndex,
          };
          gsFeeRecord.duplicate = isDuplicateRecord(
            gsFeeRecord,
            data.topExpenseRecords,
          );
          expenses.push(gsFeeRecord);
        }

        if (amount > 0) {
          if (
            description.indexOf('Balance migration to another') >= 0 ||
            recordType === 'CASHBACK'
          ) {
            // TODO transfer
          } else {
            gsRecord.id =`revolut-income-${incomes.length.toString()}`;
            incomes.push(gsRecord);
          }
        } else {
          gsRecord.id = `revolut-expense-${expenses.length.toString()}`;
          gsRecord.duplicate = isDuplicateRecord(
            gsRecord,
            data.topExpenseRecords,
          );
          expenses.push(gsRecord);
        }
      }
    }

    // @ts-ignore
    window['revolut'] = { expenses, incomes, empty, manual };
    return { expenses, incomes, empty, manual };
  } catch (err) {
    console.error(err);
    throw err;
  }
}

function getRevolutRecords(csvString: string): RevolutCsvRow[] {
  return Papa.parse<string[]>(csvString, { skipEmptyLines: true })
    .data.reduce<RevolutCsvRow[]>(
      (
        acc,
        [
          recordType,
          product,
          startedDate,
          completedDate,
          description,
          amount,
          fee,
          currency,
          state,
          balance,
        ],
        index,
      ) => {
        if (recordType && recordType !== 'Type') {
          acc.push({
            recordType,
            product,
            startedDate,
            completedDate,
            description,
            amount,
            fee,
            currency,
            state,
            balance,
            rowIndex: index,
          });
        }
        return acc;
      },
      [],
    )
    .sort((a, b) => Date.parse(b.startedDate) - Date.parse(a.startedDate));
}
