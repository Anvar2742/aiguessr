import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AdminProtectedRouteProps {
    children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
    const { user, role, loading } = useAuth(); // Add `loading` check

    if (loading) {
        // Show a loading spinner or message while role is being fetched
        return <p>Loading...</p>;
    }

    if (!user?.email) {
        // Redirect unauthenticated users to the signup page
        return <Navigate to="/hiddenbase/signup" replace />;
    }

    if (!role) return;

    if (role !== 'admin') {
        // Redirect non-admin users to the main page
        return <Navigate to="/" replace />;
    }

    // Render children if the user is authenticated and is an admin
    return <>{children}</>;
};


export default AdminProtectedRoute;
