import React, { useContext, useEffect, useState } from 'react';
import './App.css';
import { Route, Routes } from 'react-router-dom';
import AddExpenseForm from './pages/AddExpenseForm';
import CsvExportPage from './pages/CsvExportPage';
import StatementPage from './pages/StatementPage';
import RunningBalancePage from './pages/RunningBalancePage';
import { RoutePath } from './route-path.enum';
import { MainNavigation } from './components/MainNavigation';
import { HomeFinanceDataContextProvider, HomeFinanceDataContext } from './shared/data-context';

function AppContent() {
    const { homeFinanceData, loading, authError } = useContext(HomeFinanceDataContext);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
                <div className="text-center">
                    <div className="spinner-border spinner-border-lg mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <h4>Loading Home Finance Data...</h4>
                    <p className="text-muted">Please wait while we load your financial data from Google Sheets.</p>
                </div>
            </div>
        );
    }

    if (!homeFinanceData) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
                <div className="text-center col-lg-6 col-md-8 col-sm-10 col-12">
                    <div className={`alert ${authError ? 'alert-danger' : 'alert-warning'}`} role="alert">
                        <h4 className="alert-heading">
                            {authError ? 'Authentication Error' : 'Authentication Required'}
                        </h4>
                        {authError ? (
                            <p>{authError}</p>
                        ) : (
                            <p>Please allow access to your Google account to load the necessary data.</p>
                        )}
                        <hr />
                        <p className="mb-0">
                            {authError ? 
                                'Please refresh the page and try again. Make sure your domain is configured in Google Cloud Console.' :
                                'If the popup doesn\'t appear, please check if popups are blocked for this site and refresh the page.'
                            }
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <header>
                <MainNavigation />
            </header>
            <main className="p-3">
                <Routes>
                    <Route path={RoutePath.root} element={<AddExpenseForm />} />
                    <Route path={RoutePath.csv} element={<CsvExportPage />} />
                    <Route path={RoutePath.addExpense} element={<AddExpenseForm />} />
                    <Route path={RoutePath.statement} element={<StatementPage gapiReady={true} />} />
                    <Route path={RoutePath.runningBalance} element={<RunningBalancePage />} />
                </Routes>
            </main>
        </>
    );
}

function App() {
    const [gapiReady, setGapiReady] = useState(false);
    const [authError, setAuthError] = useState<string>('');

    useEffect(() => {
        const DISCOVERY_DOC_SHEETS = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
        const DISCOVERY_DOC_DRIVE = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
        const SCOPES = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets';

        gapi.load('client', async () => {
            try {
                await gapi.client.init({
                    apiKey: process.env.REACT_APP_API_KEY,
                    discoveryDocs: [DISCOVERY_DOC_SHEETS, DISCOVERY_DOC_DRIVE],
                });

                const tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: process.env.REACT_APP_CLIENT_ID,
                    scope: SCOPES,
                    callback: (tokenResponse: google.accounts.oauth2.TokenResponse) => {
                        if (tokenResponse.error) {
                            console.error('OAuth error:', tokenResponse);
                            setAuthError(`Authentication failed: ${tokenResponse.error}`);
                            return;
                        }
                        setGapiReady(true);
                        setAuthError('');
                    },
                    error_callback: (error: any) => {
                        console.error('OAuth initialization error:', error);
                        setAuthError(`Authentication initialization failed: ${error.type || 'Unknown error'}`);
                    }
                });

                const token = gapi.client.getToken();
                if (token) {
                    tokenClient.requestAccessToken({ prompt: '' });
                } else {
                    tokenClient.requestAccessToken({ prompt: 'consent' });
                }
            } catch (error) {
                console.error('GAPI initialization error:', error);
                setAuthError('Failed to initialize Google API. Please check your internet connection and refresh the page.');
            }
        });
    }, []);

    return (
        <HomeFinanceDataContextProvider gapiReady={gapiReady} authError={authError}>
            <AppContent />
        </HomeFinanceDataContextProvider>
    );
}

export default App;