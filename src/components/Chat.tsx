import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Message } from './GamePage';

interface ChatProps {
    to: string;
    messages: Message[];
    sendMessage: (to: string, message: string) => void;
    seeker: string
}

const Chat: React.FC<ChatProps> = ({ to, messages, sendMessage, seeker }) => {
    const [message, setMessage] = useState<string>('');
    const { user } = useAuth();

    const handleMessage = () => {
        if (message.trim()) {
            sendMessage(to, message);
            setMessage('');
        }
    };

    return (
        <div className="chat-container bg-gray-100 p-4 rounded-lg shadow-md">
            <h3 className='font-bold'>Msg to: {to}</h3>
            <div className="messages overflow-y-auto max-h-60 mb-4 p-2 bg-white border rounded-lg">
                {messages.map((msg, i) => (
                    <div key={msg.chatKey + i} className={`message p-1 mb-2 rounded-lg ${msg.from === user.email ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>
                        <strong>{msg.from === user.email ? "You" : msg.from}:</strong> {msg.message}
                    </div>
                ))}
            </div>
            {seeker === user.email || to === seeker ?
                <div className="input-area flex items-center">
                    <input
                        type="text"
                        className="input-message w-full p-2 border rounded-l-lg"
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <button
                        className={`send-btn p-2 text-white rounded-r-lg ${messages[messages.length - 1]?.from === user.email ? "pointer-events-none bg-gray-400" : "bg-blue-500"}`}
                        onClick={handleMessage}
                    >
                        Send
                    </button>
                </div> : ""}
        </div>
    );
};

export default Chat;
