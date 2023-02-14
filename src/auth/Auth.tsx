import { EmailAuthProvider, getAuth, User } from 'firebase/auth';
import { auth } from 'firebaseui';
import React, { PropsWithChildren, useEffect } from "react";

type ContextState = { user: User | null };

export const FirebaseAuthContext =
    React.createContext<ContextState | undefined>(undefined);

export const FirebaseAuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [user, setUser] = React.useState<User | null>(null);
    const value = { user };

    useEffect(() => {
        const unsubscribe = getAuth().onAuthStateChanged(setUser);
        return unsubscribe;
    }, []);

    if (user) {
        return (
            <FirebaseAuthContext.Provider value={value}>
                {children}
            </FirebaseAuthContext.Provider>
        );
    }
    const ui = auth.AuthUI.getInstance() || new auth.AuthUI(getAuth());
    ui.start('#auth-container', {
        signInFlow: 'popup',
        signInOptions: [
            {
                provider: EmailAuthProvider.PROVIDER_ID,
                requireDisplayName: false
            }
        ]
    })

    return <div id='auth-container'></div>

};

