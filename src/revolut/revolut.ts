import * as Papa from 'papaparse';
import {
  BankStatementProcessingResult,
  GSExpenseOrIncomeCsvRow,
  GSTransferCsvRow,
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
    const transfers: GSTransferCsvRow[] = [];
    
    for (const revolutRecord of records) {
      const amount = +revolutRecord.amount;
      const { description, recordType } = revolutRecord;
      
      if (recordType === 'ATM') {
        const transferRecord: GSTransferCsvRow = {
          id: `revolut-transfer-${transfers.length.toString()}`,
          amount: Math.abs(amount),
          currency: revolutRecord.currency,
          fromAccount: 'Revolut',
          toAccount: 'Cash',
          date: revolutRecord.startedDate,
          description,
          rowIndex: revolutRecord.rowIndex,
          duplicate: false,
        };
        transfers.push(transferRecord);
        continue;
      }
      
      if (recordType === 'TRANSFER' && description.toLowerCase().indexOf('tikkie') >= 0) {
        const gsRecord: GSExpenseOrIncomeCsvRow = {
          id: `revolut-expense-${expenses.length.toString()}`,
          amount: Math.abs(amount),
          currency: revolutRecord.currency,
          account: 'Revolut',
          category: getCategory({ amount, description }, data),
          date: revolutRecord.startedDate,
          description,
          rowIndex: revolutRecord.rowIndex,
        };
        gsRecord.duplicate = isDuplicateRecord(
          gsRecord,
          data.topExpenseRecords,
        );
        expenses.push(gsRecord);
        continue;
      }
      
      if (recordType === 'TRANSFER' && description.indexOf('Transfer from Revolut user') >= 0) {
        const transferRecord: GSTransferCsvRow = {
          id: `revolut-transfer-${transfers.length.toString()}`,
          amount: Math.abs(amount),
          currency: revolutRecord.currency,
          fromAccount: '',
          toAccount: 'Revolut',
          date: revolutRecord.startedDate,
          description,
          rowIndex: revolutRecord.rowIndex,
          duplicate: false,
        };
        transfers.push(transferRecord);
        continue;
      }
      
      if (recordType === 'TRANSFER') {
        let fromAccount = 'Revolut';
        let toAccount = '';

        if (description.indexOf('To investment account') >= 0) {
          toAccount = 'Revolut Investment';
        } else if (description.toLowerCase().indexOf('savings vault topup') >= 0) {
          toAccount = 'Revolut Savings';
        } else if (description === 'From Flexible account') {
          fromAccount = 'Revolut Savings';
          toAccount = 'Revolut';
        } else if (description === 'Savings vault withdrawal from prefunding wallet') {
          fromAccount = 'Revolut Savings';
          toAccount = 'Revolut';
        }

        const transferRecord: GSTransferCsvRow = {
          id: `revolut-transfer-${transfers.length.toString()}`,
          amount: Math.abs(amount),
          currency: revolutRecord.currency,
          fromAccount,
          toAccount,
          date: revolutRecord.startedDate,
          description,
          rowIndex: revolutRecord.rowIndex,
          duplicate: false,
        };
        transfers.push(transferRecord);
        continue;
      }
      
      if (recordType === 'TOPUP' && description === 'Payment from I Afanasov Cj') {
        const transferRecord: GSTransferCsvRow = {
          id: `revolut-transfer-${transfers.length.toString()}`,
          amount: Math.abs(amount),
          currency: revolutRecord.currency,
          fromAccount: 'ABN',
          toAccount: 'Revolut',
          date: revolutRecord.startedDate,
          description,
          rowIndex: revolutRecord.rowIndex,
          duplicate: false,
        };
        transfers.push(transferRecord);
        continue;
      }

      
      if (amount === 0) {
        // 0.00 === 0 is false for some reason
        empty.push(revolutRecord);
        continue;
      }
      
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
          gsRecord.id =`revolut-income-${incomes.length.toString()}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
          incomes.push(gsRecord);
        }
      } else {
        gsRecord.id = `revolut-expense-${expenses.length.toString()}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        gsRecord.duplicate = isDuplicateRecord(
          gsRecord,
          data.topExpenseRecords,
        );
        expenses.push(gsRecord);
      }
    }

    const uniqueTransfers: GSTransferCsvRow[] = [];
    for (const t of transfers) {
      const isDup = uniqueTransfers.some(u =>
        u.amount === t.amount &&
        u.fromAccount === t.fromAccount &&
        u.toAccount === t.toAccount &&
        Math.abs(Date.parse(u.date) - Date.parse(t.date)) < 5000
      );
      if (!isDup) {
        uniqueTransfers.push(t);
      }
    }
    
    return { expenses, incomes, transfers: uniqueTransfers, empty, manual };
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
