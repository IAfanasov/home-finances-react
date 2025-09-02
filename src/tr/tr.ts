import {
  BankStatementProcessingResult,
  GSExpenseOrIncomeCsvRow,
  HomeFinanceData,
} from '../model';
import * as pdfjsLib from 'pdfjs-dist';
import { getCategory } from '../shared/category-utils';

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
    const items = textContent.items.map((item: any) => ({
      str: item.str,
      transform: item.transform,
      width: item.width,
      height: item.height,
      x: item.transform[4],
      y: item.transform[5]
    }));

    // Group items by y-coordinate to reconstruct lines
    const yGroups = new Map<number, typeof items>();
    for (const item of items) {
      const y = Math.round(item.y);
      if (!yGroups.has(y)) {
        yGroups.set(y, []);
      }
      yGroups.get(y)!.push(item);
    }

    // Sort items within each line by x-coordinate and join them
    const lines = Array.from(yGroups.entries())
      .sort(([y1], [y2]) => y2 - y1) // Sort lines from top to bottom
      .map(([_, items]) => {
        const sortedItems = items.sort((a, b) => a.x - b.x);
        return sortedItems.map(item => item.str).join('');
      });

    // Find the range between 'ACCOUNT TRANSACTIONS' and 'BALANCE OVERVIEW'
    const startIdx = lines.findIndex(line => line.toUpperCase().includes('ACCOUNT TRANSACTIONS'));
    const endIdx = lines.findIndex(line => line.toUpperCase().includes('BALANCE OVERVIEW'));
    let relevantLines = lines;
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      relevantLines = lines.slice(startIdx + 1, endIdx);
    }
    console.log('Relevant lines for transactions:', relevantLines);

    // Print all relevant lines with their index for header inspection
    relevantLines.forEach((line, idx) => {
      console.log(`LINE ${idx}:`, line);
    });

    // Find the header line - it should contain "DATE TYPE DESCRIPTION BALANCE"
    const headerIdx = relevantLines.findIndex(line =>
      /date.*type.*description.*balance/i.test(line)
    );
    
    if (headerIdx === -1) {
      console.log('No header found in this page');
      continue;
    }

    console.log('Found header at line', headerIdx, ':', relevantLines[headerIdx]);

    // Parse transactions starting after the header
    for (let i = headerIdx + 1; i < relevantLines.length; i++) {
      const line = relevantLines[i].trim();
      if (!line) continue;

      // Look for date pattern (e.g., "01 May", "02 May", etc.)
      const dateMatch = line.match(/(\d{2})\s+(\w{3})/i);
      if (!dateMatch) {
        continue;
      }

      const day = dateMatch[1];
      const monthAbbr = dateMatch[2];
      const month = getMonthFromAbbr(monthAbbr);
      const year = '2025'; // From the statement period

      // Get the next line which should contain description and amounts
      const nextLine = relevantLines[i + 1]?.trim() || '';
      
      // Extract amounts from the next line
      const amountMatches = nextLine.match(/€([\d,]+\.?\d*)/g);
      if (!amountMatches || amountMatches.length < 2) {
        console.log('No amounts found for transaction:', line, nextLine);
        continue;
      }

      // Convert amount strings to numbers
      const amounts = amountMatches.map(amt => 
        parseFloat(amt.replace('€', '').replace(',', ''))
      );

      // Determine if this is income or expense based on transaction type
      const transactionType = line.toLowerCase();
      const nextLineLower = nextLine.toLowerCase();
      const isIncome = transactionType.includes('interest') || 
                      transactionType.includes('reward') || 
                      transactionType.includes('earnings') ||
                      transactionType.includes('dividend') ||
                      transactionType.includes('saveback') ||
                      nextLineLower.includes('interest') ||
                      nextLineLower.includes('reward') ||
                      nextLineLower.includes('earnings') ||
                      nextLineLower.includes('dividend') ||
                      nextLineLower.includes('saveback');

      // For expenses, we typically see the amount and new balance
      // For incomes, we see the amount and new balance
      // The first amount is usually the transaction amount, second is the new balance
      const transactionAmount = amounts[0];
      const newBalance = amounts[1];

      // Extract description from the next line
      let description = nextLine.replace(/€[\d,]+\.?\d*/g, '').trim();
      if (!description) {
        description = line.replace(/(\d{2})\s+(\w{3})/i, '').trim();
      }

      // Clean up description - remove transaction type prefixes
      description = description.replace(/^(card|interest|reward|earnings|savings plan execution)/i, '').trim();
      
      // For card transactions, try to extract merchant name from the original line
      if (transactionType.includes('card') && !description.includes('€')) {
        const cardMatch = line.match(/card(.+)/i);
        if (cardMatch) {
          description = cardMatch[1].trim();
        }
      }

      // Create the transaction record
      const transaction = {
        date: `${year}-${month}-${day}`,
        description: description || 'Unknown transaction',
        amount: Math.abs(transactionAmount),
        type: isIncome ? 'income' : 'expense',
        balance: newBalance
      };

      console.log('Parsed transaction:', transaction);

      // Add to appropriate array
      if (isIncome) {
        const account = transaction.description.toLowerCase().includes('saveback') 
          ? 'TR investments' 
          : 'TR cash';
        incomes.push({
          id: `tr_income_${rowIndex}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          date: transaction.date,
          description: transaction.description,
          amount: transaction.amount,
          currency: 'EUR',
          account: account,
          category: getCategory({ amount: transaction.amount, description: transaction.description }, data),
          rowIndex: rowIndex++
        });
      } else {
        expenses.push({
          id: `tr_expense_${rowIndex}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          date: transaction.date,
          description: transaction.description,
          amount: transaction.amount,
          currency: 'EUR',
          account: 'TR cash',
          category: getCategory({ amount: -transaction.amount, description: transaction.description }, data),
          rowIndex: rowIndex++
        });
      }

      // Skip the next line since we've already processed it
      i++;
    }
  }

  console.log('Parsed rows:', { expenses, incomes, empty, manual });
  return { expenses, incomes, empty, manual, transfers: [] };
};

// Helper function to convert month abbreviation to number
const getMonthFromAbbr = (abbr: string) => {
  const months: { [m: string]: string } = {
    'jan.': '01', 'jan': '01',
    'feb.': '02', 'feb': '02',
    'mrt.': '03', 'mrt': '03',
    'apr.': '04', 'apr': '04',
    'mei': '05',
    'may.': '05', 'may': '05',
    'jun.': '06', 'jun': '06',
    'jul.': '07', 'jul': '07',
    'aug.': '08', 'aug': '08',
    'sep.': '09', 'sep': '09',
    'okt.': '10', 'okt': '10',
    'nov.': '11', 'nov': '11',
    'dec.': '12', 'dec': '12',
  };
  return months[abbr.toLowerCase()] || '00';
};
