import { useEffect, useState } from 'react';
import { ref, get, update, child, onValue, push, serverTimestamp, off, remove } from 'firebase/database';
import { realtimeDb } from '../firebase'; // Import your Realtime Database instance
import { useNavigate, useParams } from 'react-router-dom';
import Chat from './Chat';
import { useAuth } from '../context/AuthContext';
import { getChatKey, shuffleArray } from '../utils/utils';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { response } from 'express';


export interface Message {
    id: string;
    from: string;
    to: string;
    message: string;
    chatKey: string;
    timestamp: any;
}

const GamePage = () => {
    const { roomCode } = useParams();
    const { user } = useAuth();
    const [seeker, setSeeker] = useState<string | null>(null);
    const [players, setPlayers] = useState<string[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch and listen to room data from Realtime Database
        const roomRef = ref(realtimeDb, `rooms/${roomCode}`);

        const fetchRoomData = async () => {
            onValue(roomRef, (snapshot) => {
                if (snapshot.exists()) {
                    const roomData = snapshot.val();
                    setSeeker(roomData.seeker);
                    setPlayers(shuffleArray([...Object.values(roomData.players), { email: "chatgpt", status: "connected" }]));
                } else {
                    console.error('Room not found:', roomCode);
                }
            });
        };

        fetchRoomData();

        // Set up a listener for messages
        const messagesRef = ref(realtimeDb, `rooms/${roomCode}/messages`);
        onValue(messagesRef, (snapshot) => {
            if (snapshot.exists()) {
                const fetchedMessages: Message[] = [];
                snapshot.forEach((childSnapshot) => {
                    const messageData = childSnapshot.val();
                    fetchedMessages.push({
                        id: childSnapshot.key || '',
                        ...messageData,
                    });
                });
                console.log(fetchedMessages);

                setMessages(fetchedMessages);
            }
        });

        // Clean up listeners on component unmount
        return () => {
            off(roomRef);
            off(messagesRef);
        };
    }, [roomCode]);

    const storeMessage = async (from: string, to: string, message: string) => {
        if (!roomCode) return;

        const messagesRef = ref(realtimeDb, `rooms/${roomCode}/messages`);
        const newMessageRef = push(messagesRef);

        await update(newMessageRef, {
            from,
            to,
            message,
            chatKey: getChatKey(from, to),
            timestamp: serverTimestamp(),
        });

        // console.log("Message stored successfully.");
    };

    const sendMessage = (to: string, message: string) => {
        if (message.trim()) {
            if (to.toLowerCase() === "chatgpt") {
                sendMessageToGPT(message);
            }
            storeMessage(user.email, to, message);
        }
    };

    // Sanitize email by taking only the part before "@"
    const sanitizeEmail = (email: string): string => {
        return email.slice(0, email.indexOf("@"));
    };
    const handleLeaveLobby = () => {
        if (user && roomCode) {
            const sanitizedEmail = sanitizeEmail(user.email);
            const playerRef = ref(realtimeDb, `rooms/${roomCode}/players/${sanitizedEmail}`);
            remove(playerRef).catch((error) => console.error("Error removing player:", error));
        }
        navigate('/');
    };

    async function fetchGPTResponse(data: { message: string; userId: string; roomCode: string }) {
        try {
            const response: any = await fetch('http://127.0.0.1:5001/aiguessr-v1/us-central1/sendMessageToGPT', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                console.error('Error response from server:', response.statusText);
                return;
            }

            const responseData = await response.json();
            console.log('Server response:', responseData);
            return responseData;
        } catch (error) {
            console.error('Error fetching GPT response:', error);
            return;
        }
    }



    async function sendMessageToGPT(userMessage: string) {
        try {
            if (!roomCode) return
            const response: any = await fetchGPTResponse({ message: userMessage, userId: user.email, roomCode });
            console.log(response);

            console.log("GPT Reply:", response.reply || "No response due to no-cors mode");
        } catch (error) {
            console.error("Error getting GPT response:", error);
        }
    }



    if (!seeker) return null;

    return (
        <div>
            <h2>Game Room: {roomCode}</h2>
            {seeker && <h3>Seeker: {seeker}</h3>}
            <div>
                <h4>Players:</h4>
                {players.map((player: any, i) =>
                    player.email === user.email ? null : player.email === "chatgpt" ? (
                        <div>
                            {getChatKey(seeker, "chatgpt")} and
                            {messages[messages.length - 2].chatKey}
                            {messages[messages.length - 2].from}
                            <Chat
                                to="ChatGPT"
                                messages={messages.filter((msg) => msg.chatKey === getChatKey(seeker, "chatgpt"))}
                                sendMessage={sendMessage}
                                key={i}
                                seeker={seeker}
                            />
                        </div>
                    ) : (
                        <Chat
                            to={player.email}
                            messages={messages.filter((msg) => msg.chatKey === getChatKey(user.email, player.email))}
                            sendMessage={sendMessage}
                            key={i}
                            seeker={seeker}
                        />
                    )
                )}
            </div>

            <div className="mt-6">
                <button
                    onClick={handleLeaveLobby}
                    className="w-full py-2 mt-4 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                    Leave Lobby
                </button>
            </div>
        </div>
    );
};

export default GamePage;
