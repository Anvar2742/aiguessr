// src/components/JoinRoom.tsx (Updated to use socket for joining)
import React, { useState, useEffect } from 'react';
import { db, query, where, getDocs, collection, updateDoc, doc } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';

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
            const q = query(collection(db, 'rooms'), where('name', '==', roomCode));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('Room not found');
                return;
            }

            querySnapshot.forEach(async (doc) => {
                const roomRef = doc.ref;
                const roomData = doc.data();
                const players = roomData.players || [];

                if (players.includes(user?.email)) {
                    setError('You are already in this room');
                    return;
                }

                players.push(user?.email);
                await updateDoc(roomRef, { players });

                navigate(`/lobby/${roomCode}`);
            });

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
