import { getApp } from 'firebase/app';
import { collection, doc, getDocs, getFirestore, setDoc } from "firebase/firestore";
import { useCallback } from 'react';
import { CategoryData, HomeFinanceData } from '../model';
import { Collections } from '../shared/constants';


interface UseLoadHomeFinanceDataArgs {
  onDataLoaded: (data: HomeFinanceData) => void;
}
export function useLoadHomeFinanceData({ onDataLoaded }: UseLoadHomeFinanceDataArgs) {
  return useCallback(async () => {
    const app = getApp();
    const db = getFirestore(app);

    const accountColRef = collection(db, Collections.accounts);
    const incomeCategoriesColRef = collection(db, Collections.income_categories);
    const expenseCategoriesColRef = collection(db, Collections.expence_categories);
    const currenciesColRef = collection(db, Collections.currencies);

    const snapshots = (await Promise.all([accountColRef, incomeCategoriesColRef, expenseCategoriesColRef,currenciesColRef].map(getDocs)))
    const [accountsSnapshot, incomeCategoriesSnapshot, expenseCategoriesSnapshot, currenciesSnapshot] = snapshots;

    const accounts = accountsSnapshot.docs.map(x => x.id);

    const incomeCategories: CategoryData[] = incomeCategoriesSnapshot.docs.map(x => ({
      name: x.id,
      synonyms: x.data().synonyms,
      tokens: x.data().tokens,
    }));
    
    const expenseCategories: CategoryData[] = expenseCategoriesSnapshot.docs.map(x => ({
      name: x.id,
      synonyms: x.data().synonyms,
      tokens: x.data().tokens,
    }));

    const currencies = currenciesSnapshot.docs.map(x => x.id);

    onDataLoaded({
      currencies,
      incomeCategories,
      expenseCategories,
      accounts,
    });
  }, [onDataLoaded]);
}
