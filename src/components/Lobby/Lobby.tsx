import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { realtimeDb } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Player } from '../../utils/utils';
import { handleCopyClick, handleStartGame, useLobbyManager } from './LobbyActions';
import { handleLeaveLobby } from '../Game/RoomActions';
import LoadingScreen from '../LoadingScreen';

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
    useLobbyManager({
        realtimeDb,
        user,
        roomCode,
        setPlayers,
        setError,
        setLoading,
        setHost,
        navigate,
    });

    return (
        <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg">
            <div className='mb-10'>
                <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Lobby: {roomCode}</h2>
                <button onClick={() => handleCopyClick(roomCode, setCopySuccess)} className="bg-blue-500 text-white font-semibold py-2 px-6 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-200 ease-in-out">
                    Copy invite link
                </button>
                {copySuccess && <p>Room code copied to clipboard!</p>}
            </div>

            {loading ? (
                <LoadingScreen isFull={false} />
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
                                onClick={() => handleStartGame(players, setError, realtimeDb, roomCode)}
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
                                onClick={() => handleLeaveLobby(roomCode, user?.email, navigate)}
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
