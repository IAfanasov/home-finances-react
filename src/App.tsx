import { FirebaseOptions, initializeApp } from 'firebase/app';
import { memo } from 'react';
import './App.css';
import { FirebaseAuthProvider } from './auth/Auth';
import { Root } from './components/Root';

const firebaseConfig: FirebaseOptions = {
    apiKey: "AIzaSyBTA-hUQB5p_iI9dNf2Z823PzBhoeyG7Hw",
    authDomain: "homefinance-c385b.firebaseapp.com",
    projectId: "homefinance-c385b",
    storageBucket: "homefinance-c385b.appspot.com",
    messagingSenderId: "701998758589",
    appId: "1:701998758589:web:ffc616ad43c639689115d4",
    measurementId: "G-K72K3SXL5F"
};
export const App = memo(() => {


    initializeApp(firebaseConfig)

    return <FirebaseAuthProvider> <Root /></FirebaseAuthProvider>;
})