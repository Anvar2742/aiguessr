import { useEffect, useState, useRef } from 'react';
import { ref, update, onValue, push, serverTimestamp, off } from 'firebase/database';
import { realtimeDb } from '../../firebase';
import { useNavigate, useParams } from 'react-router-dom';
import Chat from './Chat';
import { useAuth } from '../../context/AuthContext';
import { getChatKey, isInvalidEmailAndContainsChatGPT, Player, sanitizeEmail } from '../../utils/utils';
import botLogo from "../../assets/Union.png"
import hiderLogo from "../../assets/Subtract.png"
import { sendMessageToGPT } from './GptUtils';
import { handleGuess } from './RoundOver';
import { fetchMessages, fetchRoomData, handleLeaveLobby, handleReStartGame } from './RoomActions';

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
    const [players, setPlayers] = useState<Record<string, Player>>();
    const [messages, setMessages] = useState<Message[]>([]);
    const [guessTime, setGuessTime] = useState<boolean>(false);
    const [playerState, setPlayerState] = useState<string>();
    const [winner, setWinner] = useState<string>();
    const hasNotifiedRef = useRef(false);
    // Keep a reference for the shuffled player order to maintain consistent state
    const shuffledPlayersRef = useRef<Record<string, Player>>();

    // console.log(messages);

    const sendMessage = async (to: string, message: string) => {
        if (!message.trim()) return;
        await storeMessage(user?.email || '', to, message);
        if (isInvalidEmailAndContainsChatGPT(to)) {
            await sendMessageToGPT(message, user, roomCode);
        }
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

    useEffect(() => {
        fetchRoomData(roomCode, setSeeker, shuffledPlayersRef, setPlayers, navigate);
    }, [roomCode, navigate]);

    useEffect(() => {
        const unsubscribe = fetchMessages(roomCode, setMessages);

        return unsubscribe; // Cleanup subscription
    }, [roomCode]);

    useEffect(() => {
        if (!roomCode) return;


        const roomRef = ref(realtimeDb, `rooms/${roomCode}`);

        const listener = onValue(roomRef, async (snapshot) => {
            if (snapshot.exists()) {
                const roomData = snapshot.val();
                setWinner(roomData.winner)

                if (roomData.gameState === "round") {
                    const sanitizedEmail = sanitizeEmail(user?.email)
                    setMessages([]);
                    setSeeker(roomData.seeker);
                    setGuessTime(false);
                    setPlayerState(roomData.players[sanitizedEmail].state)

                    // Update gameState to "start"
                    try {
                        await update(roomRef, { gameState: "start" });
                    } catch (error) {
                        console.error("Failed to update game state:", error);
                    }
                } else if (roomData.gameState === "over") {
                    setMessages([])
                }

                // Remove room notification
                if (roomData.roomDeleted && !(user?.email === roomData.host) && !hasNotifiedRef.current) {
                    hasNotifiedRef.current = true;
                    alert("Лобби удалено хостом.");
                    navigate("/");
                }
            }
        });


        // Cleanup listener on component unmount
        return () => off(roomRef, "value", listener);
    }, [roomCode]);

    const fireGuess = (email: string) => {
        if (!seeker || !roomCode) return;
        handleGuess(email, seeker, user, players, setSeeker, roomCode, setMessages, shuffledPlayersRef, setPlayers)
    }

    useEffect(() => {
        if (!players) return
        const sanitizedEmail = sanitizeEmail(user?.email)
        setPlayerState(players[sanitizedEmail].state)
    }, [players])

    if (!seeker || !players) return;

    return (
        <div className='max-w-screen-lg mx-auto px-5'>
            <div className="flex">
                <h2>Game Room: {roomCode}</h2>
                <button
                    onClick={() => handleLeaveLobby(roomCode, user?.email, navigate)}
                    className="ml-auto py-2 px-5 mt-4 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                    Leave Lobby
                </button>
            </div>
            {winner
                ? <div className='h-[50vh] flex justify-center flex-col items-center mt-[15vh] shadow-2xl rounded-xl border'>
                    The winner: {winner}
                    <button onClick={() => handleReStartGame(roomCode)} className='py-2 px-5 mt-4 bg-green-500 text-white rounded-md hover:bg-green-600'>Start over</button>
                </div>
                : <>
                    <div className='mb-10'>
                        <h4>Players:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.entries(players)
                                .filter(([, player]) => player?.email !== user?.email && player?.state === "alive" && !(playerState === "dead" && player?.email === seeker)) // Filter out the current user
                                .map(([key, player], i) => (
                                    <Chat
                                        key={key}
                                        to={player?.email}
                                        seeker={seeker}
                                        messages={messages?.filter(
                                            (msg) =>
                                                msg.chatKey === getChatKey(
                                                    player?.email === seeker ? user?.email : seeker,
                                                    player?.email
                                                )
                                        )}
                                        sendMessage={sendMessage}
                                        i={i}
                                        guessTime={guessTime}
                                        fireGuess={fireGuess}
                                        chatKey={getChatKey(
                                            player?.email === seeker ? user?.email : seeker,
                                            player?.email
                                        )}
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
                    <div className="overflow-hidden fixed -right-[200px] -bottom-[90px] -rotate-[35deg] sm:w-[550px] w-[500px] sm:h-[270px] h-[200px] bg-gray-800 text-white flex justify-center">
                        <div className="pt-5 px-5 text-center z-10">
                            <b className='sm:text-3xl text-lg'>Your role:</b>
                            <p className={`sm:text-4xl text-xl font-extrabold capitalize ${playerState === "dead" ? "text-red-800" : seeker === user?.email ? "text-red-600" : "text-green-600"}`}>
                                {playerState === "dead" ? "Dead." : seeker === user?.email ? "seeker" : "hider"}
                            </p>
                        </div>
                        <div className="rotate-[35deg] absolute sm:w-[30%] w-[20%] sm:bottom-[110px] bottom-[50%] sm:right-[150px] right-[40%]">
                            {seeker === user?.email ? <img src={botLogo} alt="" /> : <img src={hiderLogo} />}
                        </div>
                    </div>
                </>}
        </div>
    );
};

export default GamePage;
