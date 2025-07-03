import * as Papa from 'papaparse';
import {
  BankStatementProcessingResult,
  GSExpenseOrIncomeCsvRow,
  GSTransferCsvRow,
  HomeFinanceData,
} from '../model';
import { getCategory } from '../shared/category-utils';
import { AbnCsvRow } from './model';
import { isDuplicateRecord } from '../shared/isDuplicateRecord';

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

      if (
        description.indexOf('LT913250033728930193') >= 0 ||
        description.indexOf('/TRTP/SEPA OVERBOEKING/IBAN/NL13REVO2122588111/BIC/REVONL22XXX /NAME/Igor Afanasov/REMI/Sent from Revolut/EREF/NOTPROVIDED') >= 0
      ) {
        manual.push(abnRecord);
        continue;
      }

      if (
        description.indexOf('/TRTP/SEPA OVERBOEKING/IBAN/NL79ABNA0122234367/BIC/ABNANL2A/NAME/Direct Savings/EREF/NOTPROVIDED') >= 0
      ) {
        transfers.push({
          id: `abn-transfer-${transfers.length.toString()}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          amount: Math.abs(amount),
          currency: abnRecord.mutationcode,
          fromAccount: 'ABN',
          toAccount: 'ABN saving',
          date: toDashedDate(abnRecord.transactiondate),
          description,
          rowIndex: abnRecord.rowIndex,
        });
        continue;
      }

      if (
        description.indexOf('/TRTP/SEPA OVERBOEKING/IBAN/NL79ABNA0122234367/BIC/ABNANL2A/NAME/I AFANASOV CJ/EREF/NOTPROVIDED') >= 0
      ) {
        transfers.push({
          id: `abn-transfer-${transfers.length.toString()}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          amount: Math.abs(amount),
          currency: abnRecord.mutationcode,
          fromAccount: 'ABN saving',
          toAccount: 'ABN',
          date: toDashedDate(abnRecord.transactiondate),
          description,
          rowIndex: abnRecord.rowIndex,
        });
        continue;
      }

      if (amount === 0) {
        empty.push(abnRecord);
      } else {
        const gsRecord: GSExpenseOrIncomeCsvRow = {
          id: 'temp',
          amount: Math.abs(amount),
          currency: abnRecord.mutationcode,
          account: 'ABN',
          category: getCategory({ amount, description }, data),
          date: toDashedDate(abnRecord.transactiondate),
          description,
          rowIndex: abnRecord.rowIndex,
        };

        if (amount > 0) {
          gsRecord.id = `abn-income-${incomes.length.toString()}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
          incomes.push(gsRecord);
        } else {
          gsRecord.id = `abn-expense-${expenses.length.toString()}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
          gsRecord.duplicate = isDuplicateRecord(
            gsRecord,
            data.topExpenseRecords,
          );
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
