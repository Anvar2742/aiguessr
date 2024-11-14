import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { realtimeDb, ref, onValue, update, set, remove } from '../firebase';
import { useAuth } from '../context/AuthContext';

interface Player {
    email: string;
    status: 'connected' | 'disconnected';
}

const Lobby: React.FC = () => {
    const { user } = useAuth();
    const { roomCode } = useParams<{ roomCode: string }>();
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [seeker, setSeeker] = useState<string | null>(null);
    const navigate = useNavigate();

    // Sanitize email by taking only the part before "@"
    const sanitizeEmail = (email: string): string => {
        return email.slice(0, email.indexOf("@"));
    };

    useEffect(() => {
        if (!user || !roomCode) {
            // setError("User or roomCode is undefined.");
            // setLoading(false);
            return;
        }

        const sanitizedEmail = sanitizeEmail(user.email);
        const playerRef = ref(realtimeDb, `rooms/${roomCode}/players/${sanitizedEmail}`);

        console.log("Setting player in the database:", playerRef); // Debug log

        // Attempt to set player in Realtime Database
        set(playerRef, { email: user.email, status: 'connected' })
            .then(() => {
                console.log("Player set successfully.");
                setError("")
            })
            .catch((error) => {
                console.error("Error adding player to database:", error);
                setError("Failed to join the lobby. Please check your network or database permissions.");
                setLoading(false);
            });

        // Listen for changes to player statuses
        const playersRef = ref(realtimeDb, `rooms/${roomCode}/players`);
        const playersListener = onValue(playersRef, (snapshot) => {
            const playersData = snapshot.val();
            console.log("Players data retrieved:", playersData); // Debug log

            if (playersData) {
                const updatedPlayers = Object.values(playersData) as Player[];
                setPlayers(updatedPlayers);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error listening to player data:", error);
            setError("Error loading players. Please try again.");
            setLoading(false);
        });

        // Listen for game start
        const gameRef = ref(realtimeDb, `rooms/${roomCode}/gameStarted`);
        const gameListener = onValue(gameRef, (snapshot) => {
            const gameStarted = snapshot.val();
            console.log("Game started status:", gameStarted); // Debug log
            if (gameStarted) {
                navigate(`/game/${roomCode}`);
            }
        });

        return () => {
            remove(playerRef).catch((error) => console.error("Error removing player:", error));
            playersListener();
            gameListener();
        };
    }, [roomCode, user, navigate]);

    const handleLeaveLobby = () => {
        if (user && roomCode) {
            const sanitizedEmail = sanitizeEmail(user.email);
            const playerRef = ref(realtimeDb, `rooms/${roomCode}/players/${sanitizedEmail}`);
            remove(playerRef).catch((error) => console.error("Error removing player:", error));
        }
        navigate('/');
    };

    const handleStartGame = async () => {
        if (players.length === 0) {
            setError("No players in the lobby to start the game.");
            return;
        }

        const randomSeeker = players[Math.floor(Math.random() * players.length)].email;
        setSeeker(randomSeeker);

        const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
        try {
            await update(roomRef, {
                gameStarted: true,
                seeker: randomSeeker,
                players
            });
        } catch (error) {
            console.error("Error starting the game:", error);
            setError("Failed to start the game. Please try again.");
        }
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
