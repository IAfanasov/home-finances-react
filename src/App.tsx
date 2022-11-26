import React, { useCallback, useEffect, useState } from 'react';
import './App.css';
import { Route, Routes } from 'react-router-dom';
import AddExpenseForm from './pages/AddExpenseForm';
import CsvExportPage from './pages/CsvExportPage';
import { RoutePath } from './route-path.enum';
import { MainNavigation } from './components/MainNavigation';
import { HomeFinanceData } from './model';
import { HomeFinanceDataContext } from './shared/data-context';
import { useLoadHomeFinanceData } from './components/HomeFinanceDataLoader';

function App() {
    const defaultState: Partial<{
        data: HomeFinanceData | null;
    }> = {
        data: null,
    };
    const [state, setState] = useState(defaultState);
    const onDataLoaded = useCallback((data: HomeFinanceData) => setState({ data }), [setState]);
    const loadData = useLoadHomeFinanceData({ onDataLoaded });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => loadData, []);

    return (
        <HomeFinanceDataContext.Provider
            value={
                state as {
                    data: HomeFinanceData | null;
                }
            }
        >
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
                </Routes>
            </main>
        </HomeFinanceDataContext.Provider>
    );
}

export default App;
