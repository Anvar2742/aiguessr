import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface ChatProps {
    to: string;
    messages: { from: string; message: string; to: string; chatKey: string }[];
    sendMessage: (to: string, message: string) => void;
}

const Chat: React.FC<ChatProps> = ({ to, messages, sendMessage }) => {
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

            <div className="input-area flex items-center">
                <input
                    type="text"
                    className="input-message w-full p-2 border rounded-l-lg"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <button
                    className="send-btn p-2 bg-blue-500 text-white rounded-r-lg"
                    onClick={handleMessage}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default Chat;
