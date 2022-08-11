import React from 'react';
import './App.css';
import { Route, Routes } from "react-router-dom";
import AddExpenseForm from './pages/AddExpenseForm';
import CsvExportPage from './pages/CsvExportPage';
import { RoutePath } from "./route-path.enum";
import MainNavigation from "./components/MainNavigation";

function App() {

    return (
        <React.Fragment>
            <MainNavigation></MainNavigation>
            <Routes>
                <Route path={RoutePath.root}
                       element={<AddExpenseForm/>}/>
                <Route path={RoutePath.csv}
                       element={<CsvExportPage/>}/>
                <Route path={RoutePath.addExpense}
                       element={<AddExpenseForm/>}/>
            </Routes>
        </React.Fragment>
    );
}

export default App;
