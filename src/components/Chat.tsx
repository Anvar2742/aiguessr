import React, { useState, useEffect } from 'react';
import { socket } from '../socket';  // Assuming socket is initialized in a separate file
import { useAuth } from '../context/AuthContext';

interface ChatProps {
    to: string; // Who the message is being sent to (could be a Seeker, Hider, or ChatGPT)
}

const Chat: React.FC<ChatProps> = ({ to }) => {
    const [message, setMessage] = useState<string>('');  // Message input state
    const [messages, setMessages] = useState<{ from: string; message: string }[]>([]);  // List of messages
    const [loading, setLoading] = useState<boolean>(true);
    const { user } = useAuth();

    useEffect(() => {
        // Listen for incoming messages
        socket.on('receive-message', (data) => {
            console.log(data);
            
            if (data.to === to || data.to === user.email) {
                setMessages((prevMessages) => [...prevMessages, { from: data.from, message: data.message }]);
            }
        });

        // Clean up when the component unmounts
        return () => {
            socket.off('receive-message');
        };
    }, [to]);

    const sendMessage = () => {
        if (message.trim()) {
            // Emit the message to the specified recipient (either a player or ChatGPT)
            socket.emit('send-message', message, user, to);
            setMessages((prevMessages) => [...prevMessages, { from: 'You', message }]);
            setMessage(''); // Clear the input field after sending the message
        }
    };

    return (
        <div className="chat-container bg-gray-100 p-4 rounded-lg shadow-md">
            <div className="messages overflow-y-auto max-h-60 mb-4 p-2 bg-white border rounded-lg">
                {messages.map((msg, index) => msg.from === user.email ? "" : (
                    <div key={index} className={`message p-1 mb-2 rounded-lg ${msg.from === 'You' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>
                        <strong>{msg.from}: </strong>{msg.message}
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
                    onClick={sendMessage}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default Chat;
