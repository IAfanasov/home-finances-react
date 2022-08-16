import React from "react";
import { HomeFinanceData } from "../model";

const defaultValue: {
    data: HomeFinanceData | null,
} = {
    data: null,
};
export const HomeFinanceDataContext = React.createContext(defaultValue);