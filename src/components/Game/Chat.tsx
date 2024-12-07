import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Message } from './GamePage';
import botLogo from "../../assets/union_black.png"
import hiderLogo from "../../assets/Subtract.png"

interface ChatProps {
    to: string;
    messages: Message[];
    sendMessage: (to: string, message: string) => void;
    seeker: string | null;
    i: number;
    guessTime: boolean;
    fireGuess: (guessEmail: string) => void;
    chatKey: string;
}

const Chat: React.FC<ChatProps> = ({ to, messages, sendMessage, seeker, i, guessTime, fireGuess }) => {
    const [message, setMessage] = useState<string>('');
    const [msgPoints, setMsgPoints] = useState<number>();
    const { user } = useAuth();
    const [canSendMessage, setCanSendMessage] = useState<boolean>(false);
    const [currentTurn, setCurrentTurn] = useState<string | null>(null); // Track whose turn it is
    const chatBoxRef = useRef<HTMLDivElement | null>(null);

    // Auto-scroll to the last message when `messages` changes
    useEffect(() => {
        if (chatBoxRef.current) {
            // Calculate the scroll position to reach the last message
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }

        setMsgPoints(5 - messages.filter((msg) => msg.from === seeker).length)
    }, [messages]);

    // Determine turn logic based on the last message
    useEffect(() => {
        if (messages.length === 0) {
            // If no messages exist, set the seeker to start
            setCanSendMessage(user?.email === seeker);
            setCurrentTurn(seeker); // Seeker starts the first message
        } else {
            const lastMessage = messages[messages.length - 1];
            const lastSender = lastMessage.from;
            const turn = lastMessage.to;

            // Update turn and permissions
            if (turn.toLowerCase() === 'chatgpt') {
                setCanSendMessage(false);
            } else if (lastSender === seeker) {
                // If the last sender is the seeker, it's the hider's turn
                setCanSendMessage(user?.email === turn);
            } else {
                // If the last sender is a hider, it's the seeker's turn
                setCanSendMessage(user?.email === seeker);
            }

            // Update the turn indicator
            setCurrentTurn(turn);
        }
    }, [messages, seeker, user?.email]);

    const handleKeyDown = (event: { key: string; shiftKey: any; preventDefault: () => void; }) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault(); // Prevent newline insertion
            handleMessage();
        }
    };
    const handleMessage = () => {
        if (message.trim() && canSendMessage && message.length < 60) {
            // Send the message and switch turns
            sendMessage(to, message);
            setMessage('');
        }
    };
    // console.log(messages);


    return (
        <div className={`chat-container bg-gray-100 p-4 rounded-lg shadow-xl mt-10 mx-5 border border-gray-500 relative ${message.length >= 60 ? "border-red-300 border-2 shadow-red-300 shadow-lg" : ""} ${(to === seeker && seeker !== user?.email) ? "bg-blue-200" : ""}`}>
            <div className="flex justify-between items-center mb-5 px-5">
                <h3 className="font-bold">Chat {i + 1} {(to === seeker && seeker !== user?.email) && "- Your chat"}</h3>
                {seeker !== user?.email ? <span className={`fixed left-10 bottom-10 bg-blue-600 p-2 px-3 rounded-xl font-bold text-white transition-all duration-200 ${currentTurn === user?.email ? "" : "-translate-x-[200%]"}`}>
                    Чекай свой чат!
                    <span className="flex h-3 w-3 -top-1 -right-1 absolute">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                </span> : ""}
                {
                    <div className="msg-count absolute w-8 h-8 flex justify-center items-center text-white font-bold text-lg pointer-events-none rounded-full bg-green-700 -right-2 -top-2">
                        {msgPoints}
                    </div>
                }
                {
                    guessTime &&
                    <button
                        className="send-btn p-2 text-white rounded-lg bg-blue-500"
                        onClick={() => fireGuess(to)}
                    >
                        Chat {i + 1} is AI.
                    </button>
                }
            </div>
            <div ref={chatBoxRef} className="messages overflow-y-auto max-h-96 mb-4 p-4 bg-white border rounded-lg min-h-16">
                {messages.length ? messages.map((msg, i) => (
                    <div
                        key={msg.chatKey + i}
                        className={`message p-1 mb-2 rounded-lg flex max-w-[80%] ${msg.from === user?.email
                            ? 'bg-blue-100 text-blue-800 ml-auto'
                            : msg.from === seeker && msg.to !== user?.email
                                ? 'bg-orange-200 text-gray-800 ml-auto'
                                : 'bg-gray-200 text-gray-800 mr-auto'
                            }`}
                    >
                        <strong>{msg.from === user?.email ? <img src={botLogo} className="min-w-6 min-h-6 w-6 h-6" alt="" /> : <img src={hiderLogo} className="min-w-4 min-h-6 w-4 h-6" alt="" />}</strong>
                        <p className="ml-4">{msg.message}</p>
                    </div>
                )) : <p className='p-2 text-gray-500'>Сообщения будут здесь.</p>}
            </div>

            {/* Turn indication */}
            <div className="turn-indicator text-center text-sm text-gray-600 flex justify-between mb-2">
                <p>{60 - message.length < 0 ? 0 : 60 - message.length}</p>
                {(seeker === user?.email && msgPoints && msgPoints > 0) || (to === seeker && seeker !== user?.email) // see only your chat's turns
                    ? messages.length > 0
                        ? currentTurn && currentTurn === user?.email // your turn ?
                            ? "Ваша очередь." // yes
                            : `Не ваш черед.`
                        : "В чате пусто."
                    : ""
                }
            </div>

            {/* Message input */}
            {((canSendMessage && !(msgPoints === 0 && seeker === user?.email))) && (
                <div>
                    <form className="input-area flex" onSubmit={(e) => e.preventDefault()}>
                        <textarea
                            className="input-message w-full p-2 border rounded-l-lg resize-none"
                            placeholder="Ваше сообщение"
                            onKeyDown={handleKeyDown}
                            value={message}
                            onChange={(e) => message.length > 60 && e.target.value.length > message.length ? setMessage(prevMsg => prevMsg) : setMessage(e.target.value)}
                        ></textarea>
                        <button
                            className={`send-btn p-2 text-white rounded-r-lg bg-blue-500 ${message.length > 60 ? "border-red-300 border-2 shadow-red-300 shadow-lg" : ""}`}
                            onClick={handleMessage}
                        >
                            Send
                        </button>
                    </form>
                </div>
            )}

            {/* Message restriction if it's not the user's turn */}
            <p className="text-gray-500 mt-10">
                {msgPoints === 0 && seeker === user?.email
                    ? "Запас сообщений исчерпан."
                    : !canSendMessage
                        ? "1 черед = 1 сообщение."
                        : ""}
            </p>
        </div>
    );
};

export default Chat;
