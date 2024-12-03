import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { realtimeDb, ref, onValue, update, set, remove } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Player, sanitizeEmail } from '../../utils/utils';

const Lobby: React.FC = () => {
    const { user } = useAuth();
    const { roomCode } = useParams<{ roomCode: string }>();
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    // const [seeker, setSeeker] = useState<string | null>(null);
    const [host, setHost] = useState<string | null>(null);
    const navigate = useNavigate();
    const [copySuccess, setCopySuccess] = useState<boolean>(false);

    useEffect(() => {
        if (!user || !roomCode) {
            return;
        }

        const sanitizedEmail = sanitizeEmail(user.email);
        const playerRef = ref(realtimeDb, `rooms/${roomCode}/players/${sanitizedEmail}`);

        // Attempt to set player in Realtime Database
        set(playerRef, { email: user.email, status: 'connected', state: "alive" })
            .then(() => {
                console.log("Player set successfully.");
                setError("");
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
            if (playersData) {
                const updatedPlayers = Object.values(playersData) as Player[];
                setPlayers(updatedPlayers);

                // If this is the first player, set them as the host
                if (updatedPlayers.length === 1 && !host) {
                    const firstPlayerEmail = updatedPlayers[0].email;
                    setHost(firstPlayerEmail);

                    // Save the host information in the database
                    const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
                    update(roomRef, { host: firstPlayerEmail });
                }
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
            if (gameStarted) {
                navigate(`/game/${roomCode}`);
            }
        });

        return () => {
            remove(playerRef).catch((error) => console.error("Error removing player:", error));
            playersListener();
            gameListener();
        };
    }, [roomCode, user, host, navigate]);

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
        // setSeeker(randomSeeker);
        // console.log(seeker);
        

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

    const handleCopyClick: React.MouseEventHandler<HTMLButtonElement> = async () => {
        try {
            if (!roomCode) return;
            await navigator.clipboard.writeText(roomCode);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            setCopySuccess(false);
            console.error('Failed to copy: ', err);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg">
            <div className='mb-10'>
                <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Lobby: {roomCode}</h2>
                <button onClick={handleCopyClick} className="bg-blue-500 text-white font-semibold py-2 px-6 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-200 ease-in-out">Copy Room Code</button>
                {copySuccess && <p>Room code copied to clipboard!</p>}
            </div>

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
                        {user?.email === host ? (
                            <button
                                onClick={handleStartGame}
                                className="w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                            >
                                Start Game
                            </button>
                        ) : (
                            <button
                                disabled
                                className="w-full py-2 bg-gray-500 text-white rounded-md cursor-not-allowed"
                            >
                                You are not the host
                            </button>
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
