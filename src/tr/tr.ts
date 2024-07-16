import {
  BankStatementProcessingResult,
  GSExpenseOrIncomeCsvRow,
  HomeFinanceData,
} from '../model';
import * as pdfjsLib from 'pdfjs-dist';
import { getCategory } from '../shared/category-utils';
import { isDuplicateRecord } from '../shared/isDuplicateRecord';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export const parseTrPdfStatement = async (
  arrayBuffer: ArrayBuffer,
  data: HomeFinanceData,
): Promise<BankStatementProcessingResult<any>> => {
  console.log('Parsing PDF content');
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const expenses: GSExpenseOrIncomeCsvRow[] = [];
  const incomes: GSExpenseOrIncomeCsvRow[] = [];
  const empty: any[] = [];
  const manual: any[] = [];
  let rowIndex = 0;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const lines = textContent.items.map((item: any) => item.str);

    console.log(`Page ${pageNum} text:`, lines.join('\n'));

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Match lines that start with a date in the format "dd MMM."
      const dateMatch = line.match(/^\d{2} \w{3}\./);

      if (dateMatch) {
        const dateParts = line.split(' ');
        const nextLine = lines[i + 1].trim();
        const date = `${nextLine}-${getMonthFromAbbr(
          dateParts[1],
        )}-${dateParts[0].padStart(2, '0')}`;
        let description = '';
        let amountLine = '';

        // Look ahead to next lines to find description and amount
        for (let j = i + 2; j < lines.length; j++) {
          const nextLine = lines[j].trim();

          if (nextLine.startsWith('€') || nextLine.includes('BEDRAG')) {
            amountLine = nextLine;
            break;
          } else {
            description += nextLine + ' ';
          }
        }

        description = description.replace('Kaarttransactie', '').trim();

        console.log(
          'Date:',
          date,
          'Description:',
          description,
          'Amount line:',
          amountLine,
        );

        let amount = 0;

        if (amountLine.includes('€')) {
          const amountMatch = amountLine.match(/€\s*([\d,.]+)/);
          if (amountMatch) {
            amount = parseFloat(
              amountMatch[1].replace('.', '').replace(',', '.'),
            );
          }
        }

        const isIncome = ['Rentebetaling', 'Savings plan execution'].some((s) =>
          description.includes(s),
        );
        const gsRecord: GSExpenseOrIncomeCsvRow = {
          amount,
          currency: 'EUR',
          account: 'TR cash',
          date,
          description,
          rowIndex: rowIndex++,
          category: getCategory(
            { amount: isIncome ? amount : -1 * amount, description },
            data,
          ),
        };

        if (amount === 0) {
          empty.push(gsRecord);
        } else {
          if (isIncome) {
            incomes.push(gsRecord);
          } else {
            gsRecord.duplicate = isDuplicateRecord(
              gsRecord,
              data.topExpenseRecords,
            );
            expenses.push(gsRecord);
          }
        }

        // Skip the lines we just processed
        i += description.split(' ').length;
      }
    }
  }

  console.log('Parsed rows:', { expenses, incomes, empty, manual });
  return { expenses, incomes, empty, manual };
};

// Helper function to convert month abbreviation to number
const getMonthFromAbbr = (abbr: string) => {
  const months: { [m: string]: string } = {
    'jan.': '01',
    'feb.': '02',
    'mrt.': '03',
    'apr.': '04',
    mei: '05',
    'jun.': '06',
    'jul.': '07',
    'aug.': '08',
    'sep.': '09',
    'okt.': '10',
    'nov.': '11',
    'dec.': '12',
  };

  return months[abbr.toLowerCase()] || '00';
};
