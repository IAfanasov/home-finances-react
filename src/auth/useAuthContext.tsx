import React from "react";
import { FirebaseAuthContext } from './Auth';


export function useAuthContext() {
    const context = React.useContext(FirebaseAuthContext);
    if (context === undefined) {
        throw new Error(
            "useFirebaseAuth must be used within a FirebaseAuthProvider"
        );
    }
    return context;
}
