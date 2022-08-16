import { Fragment } from "react";
import { HomeFinanceData } from "../model";

function HomeFinanceDataLoader(props: { onDataLoaded: (data: HomeFinanceData) => void }) {

    const CLIENT_ID = '485221312361-m4gh0jjuihu1e3fa2ita35e8s6c7jdqu.apps.googleusercontent.com';
    const API_KEY = 'AIzaSyB6BjD6bfqFKgj791HdrR3W_8D0PxIPIYM';

    const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

    const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';

    gapi.load('client', intializeGapiClient);

    function intializeGapiClient() {
        gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
        }).then(async () => {

            const tokenClient: google.accounts.oauth2.TokenClient = google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: onTokenInitialized,
            });

            const token = gapi.client.getToken();
            if (token) {
                // Skip display of account chooser and consent dialog for an existing session.
                tokenClient.requestAccessToken({prompt: ''});
            } else {
                // Prompt the user to select a Google Account and ask for consent to share their data
                // when establishing a new session.
                tokenClient.requestAccessToken({prompt: 'consent'});
            }
        }, err => {
            console.error(err);
        });
    }

    async function onTokenInitialized(tokenResponse: google.accounts.oauth2.TokenResponse) {
        if (tokenResponse.error) {
            console.error(tokenResponse);
            return
        }
        await loadData();
    }

    async function loadData() {

        async function loadArrayFromSpreadsheet(range: string): Promise<string[]> {
            console.info('loading range', range);
            let response: gapi.client.Response<gapi.client.sheets.ValueRange>;
            try {
                response = await gapi.client.sheets.spreadsheets.values.get({
                    spreadsheetId: '1LqmV3Q60_Psp8-X1bLxpXPzxZXyke1ISj5karhFbDLs',
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
            return result.values
                .flat()
                .filter(x => x)
                .slice(1);
        }

        const [currencies, incomeCategories, expenseCategories, accounts] = await Promise.all([
            loadArrayFromSpreadsheet('Currency!B:B'),
            loadArrayFromSpreadsheet(`'Income category'!A:A`),
            loadArrayFromSpreadsheet(`'Expense category'!A:A`),
            loadArrayFromSpreadsheet(`Account!B:B`),
        ])

        props.onDataLoaded({currencies, incomeCategories, expenseCategories, accounts});
    }

    return <Fragment/>;
}

export default HomeFinanceDataLoader;