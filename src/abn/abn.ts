import * as Papa from 'papaparse';
import {
  BankStatementProcessingResult,
  GSExpenseOrIncomeCsvRow,
  GSTransferCsvRow,
  HomeFinanceData,
} from '../model';
import { getCategory } from '../shared/category-utils';
import { AbnCsvRow } from './model';

export function processAbn(
  csvString: string,
  data: HomeFinanceData,
): BankStatementProcessingResult<AbnCsvRow> {
  console.log(`Processing ABN`);
  try {
    const records = getAbnRecords(csvString);
    console.log(`Processing ${records.length} parsed records`);
    console.log({ records });
    const incomes: GSExpenseOrIncomeCsvRow[] = [];
    const empty: AbnCsvRow[] = [];
    const manual: AbnCsvRow[] = [];
    const expenses: GSExpenseOrIncomeCsvRow[] = [];
    const transfers: GSTransferCsvRow[] = [];
    for (const abnRecord of records) {
      const amount = +abnRecord.amount.replace(',', '.');
      const { description } = abnRecord;

      // Skip transfers in savings account (122234367) that reference main account
      // to avoid duplicates - these are already recorded from main account perspective
      if (
        abnRecord.accountNumber === '122234367' &&
        description.indexOf('NL86ABNA0832863904') >= 0
      ) {
        continue;
      }

      if (description.indexOf('LT913250033728930193') >= 0) {
        manual.push(abnRecord);
        continue;
      }

      // Detect transfers between ABN and Revolut based on Revolut IBAN
      if (description.indexOf('NL13REVO2122588111') >= 0) {
        transfers.push({
          id: `abn-transfer-${transfers.length.toString()}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          amount: Math.abs(amount),
          currency: abnRecord.mutationcode,
          fromAccount: amount > 0 ? 'Revolut' : 'ABN',
          toAccount: amount > 0 ? 'ABN' : 'Revolut',
          date: toDashedDate(abnRecord.transactiondate),
          description,
          rowIndex: abnRecord.rowIndex,
        });
        continue;
      }

      // Detect transfers between ABN and ABN saving based on savings account IBAN
      if (description.indexOf('NL79ABNA0122234367') >= 0) {
        const isToSavings = description.indexOf('Direct Savings') >= 0;
        const isFromSavings = description.indexOf('I AFANASOV CJ') >= 0;

        if (isToSavings || isFromSavings) {
          transfers.push({
            id: `abn-transfer-${transfers.length.toString()}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            amount: Math.abs(amount),
            currency: abnRecord.mutationcode,
            fromAccount: isFromSavings ? 'ABN saving' : 'ABN',
            toAccount: isFromSavings ? 'ABN' : 'ABN saving',
            date: toDashedDate(abnRecord.transactiondate),
            description,
            rowIndex: abnRecord.rowIndex,
          });
          continue;
        }
      }

      if (amount === 0) {
        empty.push(abnRecord);
      } else {
        // Determine category
        let category = getCategory({ amount, description }, data);

        // Auto-assign "bank interest" category for income with "interest" in description
        if (amount > 0 && description.toLowerCase().indexOf('interest') >= 0) {
          category = 'bank interest';
        }

        const gsRecord: GSExpenseOrIncomeCsvRow = {
          id: 'temp',
          amount: Math.abs(amount),
          currency: abnRecord.mutationcode,
          account: 'ABN',
          category,
          date: toDashedDate(abnRecord.transactiondate),
          description,
          rowIndex: abnRecord.rowIndex,
        };

        if (amount > 0) {
          gsRecord.id = `abn-income-${incomes.length.toString()}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
          incomes.push(gsRecord);
        } else {
          gsRecord.id = `abn-expense-${expenses.length.toString()}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
          expenses.push(gsRecord);
        }
      }
    }

    expenses.sort((a, b) => -1 * a.date.localeCompare(b.date));
    incomes.sort((a, b) => -1 * a.date.localeCompare(b.date));
    return { expenses, incomes, empty, manual, transfers };
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export function toDashedDate(numStr: string): string {
  return `${numStr.substr(0, 4)}-${numStr.substr(4, 2)}-${numStr.substr(6, 2)}`;
}

function getAbnRecords(csvString: string): AbnCsvRow[] {
  return Papa.parse<string[]>(csvString, { skipEmptyLines: true })
    .data.filter((row) => row[0])
    .map(
      (
        [
          accountNumber,
          mutationcode,
          transactiondate,
          startsaldo,
          endsaldo,
          valuedate,
          amount,
          description,
        ],
        index,
      ) => ({
        accountNumber,
        mutationcode,
        transactiondate,
        startsaldo,
        endsaldo,
        valuedate,
        amount,
        description,
        rowIndex: index,
      }),
    );
}
