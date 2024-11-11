// src/components/CreateRoom.tsx
import React, { useState } from 'react';
import { db, addDoc, collection } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom'; // Using react-router for navigation

const CreateRoom: React.FC = () => {
  const { user } = useAuth();
  const [roomName, setRoomName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName) {
      setError('Room name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Create a new room document in Firestore
      const roomRef = await addDoc(collection(db, 'rooms'), {
        name: roomName,
        creator: user?.email,
        createdAt: new Date(),
        players: [user?.email], // Add the creator to the players list
      });

      // Navigate to the newly created room's lobby page
      navigate(`/lobby/${roomName}`); // Redirect to lobby using room name as code
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Create a Room</h2>
      <form onSubmit={handleCreateRoom} className="space-y-4">
        <div>
          <label htmlFor="roomName" className="block text-sm font-medium text-gray-700">Room Name</label>
          <input
            type="text"
            id="roomName"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
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
          {loading ? 'Creating room...' : 'Create Room'}
        </button>
      </form>
    </div>
  );
};

export default CreateRoom;
