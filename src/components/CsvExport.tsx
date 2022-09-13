import React, { useContext, useState } from 'react';
import { GSExpenseOrIncomeCsvRow, RevolutCsvRow } from "../model";
import { AbnCsvRow } from "../abn/model";
import { processAbn } from "../abn/abn";
import { IncomeOrExpenseSection } from "../income-or-expense-section/IncomeOrExpenseSection";
import { processRevolut } from "../revolut/revolut";
import { HomeFinanceDataContext } from "../shared/data-context";

function CsvExport() {
    const initialState: {
        succeed: boolean,
        expenses: GSExpenseOrIncomeCsvRow[],
        incomes: GSExpenseOrIncomeCsvRow[],
        empty: AbnCsvRow[] | RevolutCsvRow[],
        error: string
    } = {
        succeed: true,
        expenses: [],
        incomes: [],
        empty: [],
        error: ''
    };
    const [state, setState] = useState(initialState);
    const {data: homeFinanceData} = useContext(HomeFinanceDataContext);

    async function processNewText(text: string) {
        try {
            let result: { expenses: GSExpenseOrIncomeCsvRow[], incomes: GSExpenseOrIncomeCsvRow[], empty: AbnCsvRow[] | RevolutCsvRow[] };
            if (text.split('\t').length > 3) {
                result = processAbn(text, homeFinanceData!);
            } else {
                result = processRevolut(text, homeFinanceData!);
            }
            setState({
                succeed: true,
                expenses: result.expenses,
                incomes: result.incomes,
                empty: result.empty,
                error: ''
            });
        } catch (err: any) {
            setState({
                succeed: false,
                expenses: state.expenses,
                incomes: state.incomes,
                empty: state.empty,
                error: err?.toString(),
            });
        }
    }

    return (
        homeFinanceData &&
        <div className='p-3'>
            <textarea className="form-control mb-2"
                      rows={10}
                      onChange={newVal => processNewText(newVal.target.value)}></textarea>

            {
                state.succeed
                    ? <div><i className="bi bi-check-circle text-success"></i> Success</div>
                    : <div><i className="bi bi-x-circle text-danger pr-1"></i> {state.error}</div>
            }

            <div className='d-flex gap-5'>
                <IncomeOrExpenseSection title={"Expenses"}
                                        records={state.expenses}></IncomeOrExpenseSection>
                <IncomeOrExpenseSection title={"Incomes"}
                                        records={state.incomes}></IncomeOrExpenseSection>
            </div>
            <h5>Empty ({state.empty.length})</h5>
            <pre className="p-3">{JSON.stringify(state.empty, null, 4)}</pre>
        </div>
    );
}

export default CsvExport;
