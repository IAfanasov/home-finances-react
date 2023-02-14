import { memo, useCallback, useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { MainNavigation } from '../components/MainNavigation';
import { useLoadHomeFinanceData } from '../firebase/useLoadHomeFinanceData';
import { HomeFinanceData } from '../model';
import AddExpenseForm from '../pages/AddExpenseForm';
import CsvExportPage from '../pages/CsvExportPage';
import { RoutePath } from '../route-path.enum';
import { HomeFinanceDataContext } from '../shared/data-context';

export const Root = memo(() => {
    const [homeFinanceData, setHomeFinanceData] = useState<HomeFinanceData | null>(null);
    const onDataLoaded = useCallback((data: HomeFinanceData) => setHomeFinanceData(data), [setHomeFinanceData]);
    const loadData = useLoadHomeFinanceData({ onDataLoaded });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { loadData().then() }, []);

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
                    </Routes>
                </main>
            </HomeFinanceDataContext.Provider >
            : <i className="bi bi-hourglass-split"></i>
    );
})