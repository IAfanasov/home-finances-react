import React, { useCallback, useEffect, useState } from 'react';
import './App.css';
import { Route, Routes } from 'react-router-dom';
import AddExpenseForm from './pages/AddExpenseForm';
import CsvExportPage from './pages/CsvExportPage';
import StatementPage from './pages/StatementPage';
import { RoutePath } from './route-path.enum';
import { MainNavigation } from './components/MainNavigation';
import { HomeFinanceData } from './model';
import { HomeFinanceDataContext } from './shared/data-context';
import { useLoadHomeFinanceData } from './google-sheets/useLoadHomeFinanceData';

function App() {
    const [homeFinanceData, setHomeFinanceData] = useState<HomeFinanceData | null>(null);
    const [gapiReady, setGapiReady] = useState(false);

    const onDataLoaded = useCallback((data: HomeFinanceData) => {
        setHomeFinanceData(data);
        setGapiReady(true);
    }, [setHomeFinanceData]);
    const loadData = useLoadHomeFinanceData({ onDataLoaded });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => loadData(), []);

    return (
        homeFinanceData ?
        <HomeFinanceDataContext.Provider value={{ data: homeFinanceData }}        >
            <header>
                <MainNavigation />
                <button
                    type="button"
                    className="btn btn-light"
                    onClick={loadData}
                >
                    <i className="bi bi-arrow-clockwise"></i>
                </button>
            </header>
            <main className="p-3">
                <Routes>
                    <Route path={RoutePath.root} element={<AddExpenseForm />} />
                    <Route path={RoutePath.csv} element={<CsvExportPage />} />
                    <Route path={RoutePath.addExpense} element={<AddExpenseForm />} />
                    <Route path={RoutePath.statement} element={<StatementPage gapiReady={gapiReady} />} />
                </Routes>
            </main>
        </HomeFinanceDataContext.Provider >
        : <i className="bi bi-hourglass-split"></i>
    );
}

export default App;
