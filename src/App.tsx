import React, { useEffect, useState } from 'react';
import './App.css';
import { Route, Routes } from 'react-router-dom';
import AddExpenseForm from './pages/AddExpenseForm';
import CsvExportPage from './pages/CsvExportPage';
import StatementPage from './pages/StatementPage';
import RunningBalancePage from './pages/RunningBalancePage';
import { RoutePath } from './route-path.enum';
import { MainNavigation } from './components/MainNavigation';
import { HomeFinanceDataContextProvider } from './shared/data-context';

function App() {
    const [gapiReady, setGapiReady] = useState(false);

    useEffect(() => {
        const DISCOVERY_DOC_SHEETS = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
        const DISCOVERY_DOC_DRIVE = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
        const SCOPES = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets';

        gapi.load('client', async () => {
            await gapi.client.init({
                apiKey: process.env.REACT_APP_API_KEY,
                discoveryDocs: [DISCOVERY_DOC_SHEETS, DISCOVERY_DOC_DRIVE],
            });

            const tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: process.env.REACT_APP_CLIENT_ID,
                scope: SCOPES,
                callback: (tokenResponse: google.accounts.oauth2.TokenResponse) => {
                    if (tokenResponse.error) {
                        console.error(tokenResponse);
                        return;
                    }
                    setGapiReady(true);
                },
            });

            const token = gapi.client.getToken();
            if (token) {
                tokenClient.requestAccessToken({ prompt: '' });
            } else {
                tokenClient.requestAccessToken({ prompt: 'consent' });
            }
        });
    }, []);

    return (
        <HomeFinanceDataContextProvider gapiReady={gapiReady}>
            <header>
                <MainNavigation />
            </header>
            <main className="p-3">
                <Routes>
                    <Route path={RoutePath.root} element={<AddExpenseForm />} />
                    <Route path={RoutePath.csv} element={<CsvExportPage />} />
                    <Route path={RoutePath.addExpense} element={<AddExpenseForm />} />
                    <Route path={RoutePath.statement} element={<StatementPage gapiReady={gapiReady} />} />
                    <Route path={RoutePath.runningBalance} element={<RunningBalancePage />} />
                </Routes>
            </main>
        </HomeFinanceDataContextProvider>
    );
}

export default App;