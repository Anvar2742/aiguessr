import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { realtimeDb, ref, onValue, update, set, remove } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Player, sanitizeEmail } from '../../utils/utils';

const Lobby: React.FC = () => {
    const { user } = useAuth();
    const { roomCode } = useParams<{ roomCode: string }>();
    const [players, setPlayers] = useState<Record<string, Player>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    // const [seeker, setSeeker] = useState<string | null>(null);
    const [host, setHost] = useState<string | null>(null);
    const navigate = useNavigate();
    const [copySuccess, setCopySuccess] = useState<boolean>(false);

    useEffect(() => {
        console.log(user);

        if (!user) {
            console.log("no auth");

            // navigate("/")
        }
    }, [])

    useEffect(() => {
        if (!user || !roomCode) return
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
        const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
        const roomListener = onValue(
            roomRef,
            (snapshot) => {
                const roomData = snapshot.val();

                if (roomData) {
                    // Update the players state
                    const playersData = roomData.players || {};
                    setPlayers(playersData);
                    console.log("Players data updated:", playersData);

                    // Check if there is no host and set the first player as the host
                    if (!roomData.host && Object.entries(playersData).length > 0) {
                        const firstPlayerKey = Object.keys(playersData)[0];
                        const firstPlayerEmail = playersData[firstPlayerKey].email;

                        setHost(firstPlayerEmail);

                        // Update the host information in the database
                        update(roomRef, { host: firstPlayerEmail })
                            .then(() => console.log("Host set successfully:", firstPlayerEmail))
                            .catch((error) => console.error("Failed to set host:", error));
                    } else {
                        setHost(roomData.host)
                    }
                } else {
                    console.error("Room data not found.");
                    setError("Room not found. Please check the room code.");
                }
                setLoading(false);
            },
            (error) => {
                console.error("Error listening to room data:", error);
                setError("Error loading room. Please try again.");
                setLoading(false);
            }
        );


        // Listen for game start
        const gameRef = ref(realtimeDb, `rooms/${roomCode}/gameState`);
        const gameListener = onValue(gameRef, (snapshot) => {
            const gameState = snapshot.val();
            if (gameState === "start") {
                navigate(`/game/${roomCode}`);
            }
        });

        return () => {
            // remove(playerRef).catch((error) => console.error("Error removing player:", error));
            roomListener();
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
        const playersLength: number = Object.entries(players).length
        if (playersLength === 0) {
            setError("No players in the lobby to start the game.");
            return;
        }

        const playersValues = Object.values(players); // Convert Record to an array of Player objects
        const randomSeeker = playersValues[Math.floor(Math.random() * playersValues.length)]?.email;

        const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
        console.log(players);

        try {
            await update(roomRef, {
                gameState: "start",
                seeker: randomSeeker
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
                        {Object.entries(players).map(([key, player], index) => (
                            <li key={index + key} className="text-gray-800">
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
