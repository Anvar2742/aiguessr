import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../socket';  // Import socket from socket.ts
import { db, collection, query, where, onSnapshot } from '../firebase';
import { useAuth } from '../context/AuthContext';

interface Player {
    email: string;
    status: 'connected' | 'disconnected';
}

const Lobby: React.FC = () => {
    const { user } = useAuth();
    const { roomCode } = useParams();  // Access roomCode from URL params
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [seeker, setSeeker] = useState<string | null>(null);  // Track the selected Seeker
    const navigate = useNavigate();  // For navigating away when leaving the lobby

    useEffect(() => {
        // Emit join-room event when the player enters the lobby page
        if (user && roomCode) {
            socket.emit('join-room', user.email, roomCode); // Emit join-room with email and roomCode
        }

        // Listen for the `game-started` event to redirect to the game page
        socket.on('game-started', (data) => {
            setSeeker(data.seeker);
            // Redirect to the game page once the game starts
            navigate(`/game/${roomCode}`);
        });

        // Listen for the `player-status` event from the server
        socket.on('player-status', (playerStatus: { email: string; roomCode: string | null; status: 'connected' | 'disconnected' }) => {
            setPlayers((prevPlayers) => {
                const updatedPlayers = prevPlayers.map((player) =>
                    player.email === playerStatus.email
                        ? { ...player, status: playerStatus.status }  // Update status if player already exists
                        : player
                );

                // If player is new, add them to the list
                if (!prevPlayers.some((player) => player.email === playerStatus.email)) {
                    updatedPlayers.push({ email: playerStatus.email, status: playerStatus.status });
                }

                return updatedPlayers;
            });
        });

        // Fetch room data from Firestore
        const q = query(collection(db, 'rooms'), where('name', '==', roomCode));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            if (querySnapshot.empty) {
                setError('Room not found');
                setLoading(false);
                return;
            }

            querySnapshot.forEach((doc) => {
                const roomData = doc.data();
                const playerList = roomData.players || [];
                setPlayers(playerList.map((email: string) => ({ email, status: 'connected' })));
                setLoading(false);
            });
        });

        return () => {
            unsubscribe();
            socket.off('player-status');  // Clean up listener on unmount
            socket.off('game-started');   // Clean up listener on unmount
        };
    }, [roomCode, user]);

    const handleLeaveLobby = () => {
        // Emit 'leave-lobby' when the user leaves the lobby
        if (user && roomCode) {
            socket.emit('leave-lobby', user.email); // Emit leave-lobby event to server to remove the player from DB
        }
        navigate('/');  // Navigate away from the Lobby page (to Main page or any other page)
    };

    const handleStartGame = () => {
        // Choose a random Seeker
        const randomSeeker = players[Math.floor(Math.random() * players.length)].email;
        setSeeker(randomSeeker);

        // Emit 'start-game' event to the server to start the game and notify everyone
        socket.emit('start-game', roomCode);
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Lobby: {roomCode}</h2>

            {loading ? (
                <p>Loading players...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <div>
                    <h3 className="text-lg font-semibold text-gray-700">Players:</h3>
                    <ul className="space-y-2 mt-4">
                        {players.map((player, index) => (
                            <li key={index} className="text-gray-800">
                                {player.email} -{' '}
                                <span className={player.status === 'connected' ? 'text-green-500' : 'text-red-500'}>
                                    {player.status === 'connected' ? 'Connected' : 'Disconnected'}
                                </span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-6">
                        {!seeker ? (
                            <button
                                onClick={handleStartGame}
                                className="w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                            >
                                Start Game
                            </button>
                        ) : (
                            <h4 className="font-semibold text-center">Seeker: {seeker}</h4>
                        )}

                        <div className="mt-6">
                            <button
                                onClick={handleLeaveLobby}
                                className="w-full py-2 mt-4 bg-red-500 text-white rounded-md hover:bg-red-600"
                            >
                                Leave Lobby
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Lobby;
