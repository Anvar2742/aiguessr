// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, onAuthStateChanged } from '../firebase';

interface AuthContextProps {
    user: any;
    setUser: React.Dispatch<React.SetStateAction<any>>;
    loading: boolean;
}

interface AuthProviderProps {
    children: ReactNode; // Allows children as a prop
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user); // Updates user session state
            setLoading(false);
        });

        return unsubscribe; // Cleanup when the component unmounts
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextProps => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
