export {};

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            REACT_APP_ROUTER_BASENAME: string;
            REACT_APP_SPREADSHEET_ID: string;
            REACT_APP_CLIENT_ID: string;
            REACT_APP_API_KEY: string;
            REACT_APP_EXPENSES_SHEET_ID: number;
            REACT_APP_INCOME_SHEET_ID: number;
        }
    }
}

