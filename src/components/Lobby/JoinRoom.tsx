import React, { useState } from 'react';
import { ref, get } from 'firebase/database';
import { realtimeDb } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const JoinRoom: React.FC = () => {
    const { user } = useAuth();
    const [roomCode, setRoomCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleJoinRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomCode) {
            setError('Room code is required');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
            const snapshot = await get(roomRef);

            if (!snapshot.exists()) {
                setError('Room not found');
                return;
            }

            const roomData = snapshot.val();
            const players = roomData.players ? Object.values(roomData.players) : []; // Convert players to array

            if (players.includes(user?.email)) {
                setError('You are already in this room');
                return;
            }

            navigate(`/lobby/${roomCode}`);
            setRoomCode('');
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-sm mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Join a Room</h2>
            <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                    <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700">Room Code</label>
                    <input
                        type="text"
                        id="roomCode"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
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
                    {loading ? 'Joining room...' : 'Join Room'}
                </button>
            </form>
        </div>
    );
};

export default JoinRoom;
