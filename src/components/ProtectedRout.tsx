import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Adjust the path as necessary

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
    const { user, loading } = useAuth(); // Include loading state from your authentication context
    const location = useLocation();

    // Show a loading indicator while the user state is being determined
    if (loading) {
        return <div>Loading...</div>; // Replace with your loading spinner or indicator
    }

    // If no user, redirect to signup page and pass the current location to `state`
    if (!user) {
        return <Navigate to="/signup" state={{ from: location }} />;
    }

    // Render the protected content
    return children;
};

export default ProtectedRoute;
