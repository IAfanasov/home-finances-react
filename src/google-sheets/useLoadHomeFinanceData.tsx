import { useCallback } from 'react';
import { CategoryData, HomeFinanceData } from '../model';

interface UseLoadHomeFinanceDataArgs {
  onDataLoaded: (data: HomeFinanceData) => void;
}
export function useLoadHomeFinanceData({ onDataLoaded }: UseLoadHomeFinanceDataArgs) {
  return useCallback(() => {
    const DISCOVERY_DOC_SHEETS = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
    const DISCOVERY_DOC_DRIVE = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'

    const SCOPES = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets';

    gapi.load('client', intializeGapiClient);

    function intializeGapiClient() {
      gapi.client
        .init({
          apiKey: process.env.REACT_APP_API_KEY,
          discoveryDocs: [DISCOVERY_DOC_SHEETS, DISCOVERY_DOC_DRIVE],
        })
        .then(
          async () => {
            const tokenClient: google.accounts.oauth2.TokenClient = google.accounts.oauth2.initTokenClient({
              client_id: process.env.REACT_APP_CLIENT_ID,
              scope: SCOPES,
              callback: onTokenInitialized,
            });

            const token = gapi.client.getToken();
            if (token) {
              // Skip display of account chooser and consent dialog for an existing session.
              tokenClient.requestAccessToken({ prompt: '' });
            } else {
              // Prompt the user to select a Google Account and ask for consent to share their data
              // when establishing a new session.
              tokenClient.requestAccessToken({ prompt: 'consent' });
            }
          },
          (err) => {
            console.error(err);
          }
        );
    }

    async function onTokenInitialized(tokenResponse: google.accounts.oauth2.TokenResponse) {
      if (tokenResponse.error) {
        console.error(tokenResponse);
        return;
      }
      await loadData();
    }

    async function loadData() {
      async function loadArrayFromSpreadsheet(range: string): Promise<string[][]> {
        console.info('loading range', range);
        let response: gapi.client.Response<gapi.client.sheets.ValueRange>;
        try {
          response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: process.env.REACT_APP_SPREADSHEET_ID,
            range,
          });
        } catch (err: any) {
          console.error(err);
          return [];
        }
        const result = response.result;
        if (!result?.values?.length) {
          console.error('No values found.');
          return [];
        }
        return result.values;
      }

      function flatten(values: string[][]): string[] {
        return values
          .flat()
          .filter((x) => x)
          .slice(1);
      }

      function extractCategories(values: string[][]): CategoryData[] {
        return values
          .slice(1)
          .filter((x) => x[0])
          .map((x) => ({
            name: x[0],
            tokens: x[3] ? x[3].split('\n') : [],
          }));
      }

      const [currencies, incomeCategories, expenseCategories, accounts] = await Promise.all([
        loadArrayFromSpreadsheet('Currency!B:B'),
        loadArrayFromSpreadsheet(`'Income category'!A:D`),
        loadArrayFromSpreadsheet(`'Expense category'!A:D`),
        loadArrayFromSpreadsheet(`Account!B:B`),
      ]);

      onDataLoaded({
        currencies: flatten(currencies),
        incomeCategories: extractCategories(incomeCategories),
        expenseCategories: extractCategories(expenseCategories),
        accounts: flatten(accounts),
      });
    }
  }, [onDataLoaded]);
}
