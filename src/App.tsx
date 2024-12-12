import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import JoinRoom from './components/Lobby/JoinRoom';
import Lobby from './components/Lobby/Lobby';
import GamePage from './components/Game/GamePage';  // Import the GamePage component
import Signup from './components/Auth/Signup';
import Login from './components/Auth/Login';
import AppContent from './components/AppContent';
import ResetPassword from './components/Auth/ResetPassword';
import AdminPage from './components/AdminPage';
// import ProtectedRoute from './components/ProtectedRout';
import SoonPage from './components/CommingSoon/SoonPage';
import AdminProtectedRoute from './components/AdminProtectedRoute';


const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<SoonPage />} />

          {/* Hidden Base Route */}
          <Route
            path="/hiddenbase/*"
            element={
              <>
                <AdminProtectedRoute>
                  <Routes>
                    <Route path="/" element={<AppContent />} />
                    <Route path="/join-room" element={<JoinRoom />} />
                    <Route path="/lobby/:roomCode" element={<Lobby />} />
                    <Route path="/game/:roomCode" element={<GamePage />} />
                    <Route path="/resetpassword" element={<ResetPassword />} />
                    <Route path="/admin" element={<AdminPage />} />
                  </Routes>
                </AdminProtectedRoute>
                <Routes>
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/login" element={<Login />} />
                </Routes>
              </>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;