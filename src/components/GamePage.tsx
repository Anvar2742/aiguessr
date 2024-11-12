import { useEffect, useState } from 'react';
import { getFirestore, query, collection, where, getDocs } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import Chat from './Chat';
import { useAuth } from '../context/AuthContext';
import { socket } from '../socket';
import { getChatKey, shuffleArray } from '../utils/utils';

const GamePage = () => {
    const { roomCode } = useParams();
    const [seeker, setSeeker] = useState<string | null>(null);
    const [players, setPlayers] = useState<string[]>([]);
    const db = getFirestore();
    const { user } = useAuth();
    const [messages, setMessages] = useState<{ from: string; message: string; to: string, chatKey: string }[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchGameData = async () => {
            if (roomCode) {
                try {
                    const roomQuery = query(
                        collection(db, 'rooms'),
                        where('name', '==', roomCode)
                    );

                    const querySnapshot = await getDocs(roomQuery);

                    if (!querySnapshot.empty) {
                        const roomDoc = querySnapshot.docs[0];
                        const roomData = roomDoc.data();
                        console.log(roomData);

                        if (roomData) {
                            setSeeker(roomData.seeker);
                            setPlayers(shuffleArray([...roomData.players, "chatgpt"]));
                        }
                    } else {
                        console.error('Room not found with the name:', roomCode);
                    }
                } catch (error) {
                    console.error('Error fetching room data:', error);
                }
            }
        };

        fetchGameData();
    }, [roomCode, db]);

    useEffect(() => {
        socket.on('receive-message', (data) => {
            console.log(data);

            const chatKey = getChatKey(data.from, data.to);
            setMessages((prevMessages) => [...prevMessages, { ...data, chatKey }]);
        });

        return () => {
            socket.off('receive-message');
        };
    }, []);

    const sendMessage = (to: string, message: string) => {
        if (message.trim()) {
            socket.emit('send-message', message, user, to);
        }
    };


    return (
        <div>
            <h2>Game Room: {roomCode}</h2>
            {seeker && <h3>Seeker: {seeker}</h3>}
            <div>
                <h4>Players:</h4>
                {players.map((player, i) =>
                    player === user.email ? null : player === "chatgpt" && seeker ? <Chat
                        to="ChatGPT"
                        messages={messages.filter((msg) => msg.chatKey === getChatKey(seeker, "ChatGPT"))}
                        sendMessage={sendMessage}
                        key={i}
                    /> : (
                        <Chat
                            to={player}
                            messages={messages.filter((msg) => msg.chatKey === getChatKey(user.email, player))}
                            sendMessage={sendMessage}
                            key={i}
                        />
                    )
                )}
            </div>
        </div>
    );
};

export default GamePage;
