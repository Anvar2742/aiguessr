import React, { useState } from 'react';
import { auth, createUserWithEmailAndPassword } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFirestore, doc, setDoc } from 'firebase/firestore'; // Firestore for storing user roles

const db = getFirestore(); // Initialize Firestore

const Signup: React.FC = () => {
    const { setUser } = useAuth();
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/hiddenbase';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Create user with Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check if the email should be an admin
            const isAdmin = email === 'anvarmusa12@gmail.com'; // Replace with your admin email logic

            // Save user role in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                role: isAdmin ? 'admin' : 'user', // Assign role
            });

            setUser(user); // Set the user in context
            navigate(from);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-sm mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Create Account</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                >
                    {loading ? 'Signing up...' : 'Sign Up'}
                </button>
            </form>
        </div>
    );
};

export default Signup;
