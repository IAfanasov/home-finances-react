import React, { useState } from 'react';
import './App.css';
import { Route, Routes } from "react-router-dom";
import AddExpenseForm from './pages/AddExpenseForm';
import CsvExportPage from './pages/CsvExportPage';
import { RoutePath } from "./route-path.enum";
import MainNavigation from "./components/MainNavigation";
import { HomeFinanceData } from "./model";
import { HomeFinanceDataContext } from "./shared/data-context";
import HomeFinanceDataLoader from "./components/HomeFinanceDataLoader";

function App() {

    const defaultState: Partial<{
        data: HomeFinanceData | null,
    }> = {
        data: null
    };
    const [state, setState] = useState(defaultState);

    return (
        <HomeFinanceDataContext.Provider value={state as {
            data: HomeFinanceData | null,
        }}>
            {!state.data &&
                <HomeFinanceDataLoader onDataLoaded={data => setState({data})}/>
            }
            <header>
                <MainNavigation></MainNavigation>
            </header>
            <main className='p-3'>
                <Routes>
                    <Route path={RoutePath.root}
                           element={<AddExpenseForm/>}/>
                    <Route path={RoutePath.csv}
                           element={<CsvExportPage/>}/>
                    <Route path={RoutePath.addExpense}
                           element={<AddExpenseForm/>}/>
                </Routes>
            </main>
        </HomeFinanceDataContext.Provider>
    );
}

export default App;
