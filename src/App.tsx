import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import JoinRoom from './components/JoinRoom';
import Lobby from './components/Lobby';
import GamePage from './components/GamePage';  // Import the GamePage component
import Signup from './components/Signup';
import Login from './components/Login';
import AppContent from './components/AppContent';
import ResetPassword from './components/ResetPassword';
import AdminPage from './components/AdminPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AppContent />} />
          <Route path="/join-room" element={<JoinRoom />} />
          <Route path="/lobby/:roomCode" element={<Lobby />} />
          <Route path="/game/:roomCode" element={<GamePage />} /> {/* New route for game page */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/resetpassword" element={<ResetPassword />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
