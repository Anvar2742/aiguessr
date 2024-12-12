import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, onAuthStateChanged } from '../firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

interface AuthContextProps {
    user: any;
    role: string | null; // Add role to the context
    setUser: React.Dispatch<React.SetStateAction<any>>;
    loading: boolean;
}

interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const db = getFirestore(); // Firestore instance

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [role, setRole] = useState<string | null>(null); // State for user role
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            setLoading(false);

            if (user) {
                try {
                    const docRef = doc(db, 'users', user.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        console.log('Fetched role:', userData.role); // Debugging
                        setRole(userData.role || null);
                    } else {
                        console.log('No document found for user:', user.uid);
                        setRole(null);
                    }
                } catch (error) {
                    console.error('Error fetching user role:', error);
                    setRole(null);
                }
            } else {
                setRole(null);
            }
        });

        return unsubscribe;
    }, []);


    return (
        <AuthContext.Provider value={{ user, role, setUser, loading }}>
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
