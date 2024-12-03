import { useEffect, useState, useCallback, useRef } from 'react';
import { ref, update, onValue, push, serverTimestamp, off, remove, get } from 'firebase/database';
import { realtimeDb } from '../firebase';
import { useNavigate, useParams } from 'react-router-dom';
import Chat from './Chat';
import { useAuth } from '../context/AuthContext';
import { getChatKey, Player, shuffleArray } from '../utils/utils';
import botLogo from "./../assets/Union.png"
import hiderLogo from "./../assets/Subtract.png"

export interface Message {
    id: string;
    from: string;
    to: string;
    message: string;
    chatKey: string;
    timestamp: string;
}

const GamePage = () => {
    const { roomCode } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [seeker, setSeeker] = useState<string | null>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [guessTime, setGuessTime] = useState<boolean>(false);


    // Keep a reference for the shuffled player order to maintain consistent state
    const shuffledPlayersRef = useRef<any[]>([]);

    const fetchRoomData = useCallback(() => {
        if (!roomCode) return;
        const roomRef = ref(realtimeDb, `rooms/${roomCode}`);

        onValue(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                const roomData = snapshot.val();
                setSeeker(roomData.seeker);

                // Shuffle players only once and store the result in a ref
                if (shuffledPlayersRef.current.length === 0) {
                    const playersArray = [...Object.values(roomData.players)];
                    const shuffledPlayers = shuffleArray(playersArray);
                    shuffledPlayersRef.current = addChatGPTAtRandomPosition(shuffledPlayers);
                }

                setPlayers(shuffledPlayersRef.current);
            } else {
                console.error('Room not found:', roomCode);
                navigate('/');
            }
        });

        return () => off(roomRef);
    }, [roomCode, navigate]);

    const fetchMessages = useCallback(() => {
        if (!roomCode) return;
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
                setMessages(fetchedMessages);
            }
        });

        return () => off(messagesRef);
    }, [roomCode]);

    const addChatGPTAtRandomPosition = (playersArray: any[]) => {
        const chatGPT = { email: "chatgpt", status: "connected" };
        const randomIndex = Math.floor(Math.random() * (playersArray.length + 1));
        return [
            ...playersArray.slice(0, randomIndex),
            chatGPT,
            ...playersArray.slice(randomIndex),
        ];
    };

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
    };

    const sendMessage = async (to: string, message: string) => {
        if (!message.trim()) return;
        await storeMessage(user?.email || '', to, message);
        if (to.toLowerCase() === "chatgpt") {
            await sendMessageToGPT(message);
        }
    };

    const sendMessageToGPT = async (message: string) => {
        try {
            const response = await fetch(import.meta.env.DEV ? 'http://127.0.0.1:5001/aiguessr-vf/europe-west1/sendMessageToGPT' : "https://sendmessagetogpt-zfgfpmp7fq-ew.a.run.app", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, userId: user?.email, roomCode }),
            });
            if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
            // const data = await response.json();
            // console.log('GPT Response:', data.reply || 'No response');
        } catch (error) {
            console.error('Error sending message to GPT:', error);
        }
    };

    const handleLeaveLobby = async () => {
        if (!roomCode || !user?.email) return;
        const sanitizedEmail = user.email.split('@')[0];
        const playerRef = ref(realtimeDb, `rooms/${roomCode}/players/${sanitizedEmail}`);
        const roomRef = ref(realtimeDb, `rooms/${roomCode}`);

        try {
            await remove(playerRef);
            const roomSnapshot = await get(roomRef);

            if (roomSnapshot.exists() && roomSnapshot.val().host === user.email) {
                await update(roomRef, { roomDeleted: true });
                setTimeout(() => remove(roomRef), 3000);
            }
        } catch (error) {
            console.error('Error leaving lobby:', error);
        }

        navigate('/');
    };



    const murderPlayer = (emailToMurder: string) => {
        const playersRef = ref(realtimeDb, `rooms/${roomCode}/players`);
        get(playersRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const players: Record<string, Player> = snapshot.val(); // Cast the players as a record of Player
                    let playerIndex: string | null = null;

                    // Find the player by email
                    for (const [index, player] of Object.entries(players)) {
                        if (player?.email === emailToMurder) {
                            playerIndex = index;
                            break;
                        }
                    }

                    if (playerIndex !== null) {
                        // Update the state property of the matched player
                        const playerRef = ref(realtimeDb, `rooms/${roomCode}/players/${playerIndex}`);
                        update(playerRef, { state: "dead" })
                            .then(() => {
                                console.log("Player state updated successfully.");
                            })
                            .catch((error) => {
                                console.error("Error updating player state:", error);
                            });
                    } else {
                        console.log("Player not found with the given email.");
                    }
                } else {
                    console.log("No players found in the database.");
                }
            })
            .catch((error) => {
                console.error("Error fetching players:", error);
            });
    }

    const deleteMessagesInRoom = async (roomCode: string) => {
        try {
            const messagesRef = ref(realtimeDb, `rooms/${roomCode}/messages`);
            setMessages([]);
            await remove(messagesRef);
            console.log("Messages deleted successfully.");
        } catch (error) {
            console.error("Error deleting messages:", error);
        }
    };

    const handleGuess = async (guessEmail: string) => {
        if (seeker !== user?.email) {
            alert("Only the seeker can make guesses.");
            return;
        }

        if (!guessEmail) {
            console.log("No chat chosen.");
            return;
        }

        if (guessEmail.toLowerCase() === "chatgpt") {
            alert("bot found")
            // set new 
            const humanAlivePlayers = players.filter(el => el.email.toLowerCase() !== "chatgpt" && el.email.toLowerCase() !== seeker)

            const randomSeeker = humanAlivePlayers[Math.floor(Math.random() * humanAlivePlayers.length)].email;

            setSeeker(randomSeeker);

            const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
            try {
                await update(roomRef, {
                    gameStarted: true,
                    seeker: randomSeeker,
                    players: players.filter(el => el.email !== "chatgpt")
                });
            } catch (error) {
                console.error("Error starting the game:", error);
            }

            if (!roomCode) return;
            deleteMessagesInRoom(roomCode)

            onValue(roomRef, (snapshot) => {
                if (snapshot.exists()) {
                    const roomData = snapshot.val();

                    // Shuffle players only once and store the result in a ref
                    if (shuffledPlayersRef.current.length === 0) {
                        const playersArray = [...Object.values(roomData.players.filter((el: { state: string; }) => el.state === "alive"))];
                        const shuffledPlayers = shuffleArray(playersArray);
                        shuffledPlayersRef.current = addChatGPTAtRandomPosition(shuffledPlayers);
                    }

                    setPlayers(shuffledPlayersRef.current);
                } else {
                    console.error('Room not found:', roomCode);
                }
            });
            return;
        }

        if (!seeker) return;
        murderPlayer(seeker)
        // don't let dead players to play
    };


    useEffect(() => {
        fetchRoomData();
        fetchMessages();
    }, [fetchRoomData, fetchMessages]);


    useEffect(() => {
        console.log(players);
    }, [players]);

    if (!seeker) return;

    return (
        <div className='max-w-screen-lg mx-auto px-5'>
            <div className="flex">
                <h2>Game Room: {roomCode}</h2>
                {/* {seeker && <h3>Seeker: {seeker}</h3>} */}

                <button
                    onClick={handleLeaveLobby}
                    className="ml-auto py-2 px-5 mt-4 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                    Leave Lobby
                </button>
            </div>
            <div className='mb-10'>
                <h4>Players:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {players.filter(player => player?.email !== user?.email).map((player, i) => (
                        <Chat
                            key={player?.email}
                            to={player?.email}
                            seeker={seeker}
                            messages={messages.filter(
                                (msg) => msg.chatKey === getChatKey(player?.email === seeker ? user?.email : seeker, player?.email)
                            )}
                            sendMessage={sendMessage}
                            i={i}
                            guessTime={guessTime}
                            handleGuess={handleGuess}
                            chatKey={getChatKey(player?.email === seeker ? user?.email : seeker, player?.email)}
                        />
                    ))}
                </div>
                {seeker === user?.email && <button
                    onClick={() => setGuessTime(prevGuess => !prevGuess)}
                    className={`ml-auto py-2 px-5 mt-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 ${guessTime ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                >
                    {guessTime ? "Don't know" : "I found the bot"}
                </button>}
            </div>
            <div className="overflow-hidden fixed -right-[200px] -bottom-[120px] -rotate-[35deg] sm:w-[550px] w-[500px] sm:h-[300px] h-[200px] bg-gray-800 text-white flex justify-center">
                <div className="pt-5 px-5 text-center z-10">
                    <b className='sm:text-3xl text-lg'>Your role:</b>
                    <p className={`sm:text-4xl text-xl font-extrabold capitalize ${seeker === user?.email ? "text-red-600" : "text-green-600"}`}>
                        {seeker === user?.email ? "seeker" : "hider"}
                    </p>
                </div>
                <div className="rotate-[35deg] absolute w-[30%] bottom-[110px] right-[150px]">
                    {seeker === user?.email ? <img src={botLogo} alt="" /> : <img src={hiderLogo} />}
                </div>
            </div>
        </div>
    );
};

export default GamePage;
