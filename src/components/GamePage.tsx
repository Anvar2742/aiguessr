import { useEffect, useState } from 'react';
import { getFirestore, query, collection, where, getDocs, addDoc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import Chat from './Chat';
import { useAuth } from '../context/AuthContext';
import { socket } from '../socket';
import { getChatKey, shuffleArray } from '../utils/utils';

export interface Message {
    id: string;
    from: string;
    to: string;
    message: string;
    chatKey: string;
    timestamp: any; // Use `Firebase.firestore.Timestamp` if you want to be more specific
}


const GamePage = () => {
    const { roomCode } = useParams();
    const [seeker, setSeeker] = useState<string | null>(null);
    const [players, setPlayers] = useState<string[]>([]);
    const db = getFirestore();
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        // Query the room by its name to get the room ID
        if (messages.length > 0) return;
        const fetchMessages = async () => {
            const roomQuery = query(
                collection(db, 'rooms'),
                where('name', '==', roomCode)
            );

            const roomSnapshot = await getDocs(roomQuery);
            if (!roomSnapshot.empty) {
                const roomDoc = roomSnapshot.docs[0];
                const roomId = roomDoc.id;

                // Set up a real-time listener for the messages subcollection within this room
                const messagesRef = collection(db, 'rooms', roomId, 'messages');
                const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

                // Real-time listener for fetching and updating messages
                const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
                    const fetchedMessages: Message[] = snapshot.docs.map(doc => ({
                        id: doc.id,
                        from: doc.data().from,
                        to: doc.data().to,
                        message: doc.data().message,
                        chatKey: doc.data().chatKey,
                        timestamp: doc.data().timestamp,
                    }));

                    setMessages(fetchedMessages);
                });

                // Clean up the listener on component unmount
                return () => unsubscribe();
            } else {
                console.error("Room not found:", roomCode);
            }
        };

        fetchMessages();

    }, [])

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

    const storeMessage = async (from: string, to: string, message: string) => {
        try {
            // Query the rooms collection for a document with the specified roomCode in the name field
            const roomQuery = query(
                collection(db, 'rooms'),
                where('name', '==', roomCode)  // Ensure roomCode is a valid, existing name
            );

            const querySnapshot = await getDocs(roomQuery);

            // Check if a room document was found
            if (querySnapshot.empty) {
                console.log("Room document not found for roomCode:", roomCode);
                return;
            }

            const roomDoc = querySnapshot.docs[0]; // Get the first matched document (assuming roomCode is unique)
            console.log("Found room document:", roomDoc.id);

            // Reference the messages subcollection within the found room document
            const messagesRef = collection(db, 'rooms', roomDoc.id, 'messages');

            // Add the message to the messages subcollection
            await addDoc(messagesRef, {
                from,
                to,
                message,
                chatKey: getChatKey(from, to),
                timestamp: serverTimestamp(), // Use server timestamp for consistent ordering
            });

            console.log("Message stored successfully.");

        } catch (error) {
            console.error("Error storing message:", error);
        }
    };

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
            if (!roomCode) {
                alert("error luv")
                return
            }
            socket.emit('send-message', message, user, to);
            // Store the message in Firestore
            storeMessage(user.email, to, message);
        }
    };

    if (!seeker) return;
    return (
        <div>
            <h2>Game Room: {roomCode}</h2>
            {seeker && <h3>Seeker: {seeker}</h3>}
            <div>
                <h4>Players:</h4>
                {players.map((player, i) =>
                    player === user.email ? null : player === "chatgpt" ? <Chat
                        to="ChatGPT"
                        messages={messages.filter((msg) => msg.chatKey === getChatKey(seeker, "ChatGPT"))}
                        sendMessage={sendMessage}
                        key={i}
                        seeker={seeker}
                    /> : (
                        <Chat
                            to={player}
                            messages={messages.filter((msg) => msg.chatKey === getChatKey(user.email, player))}
                            sendMessage={sendMessage}
                            key={i}
                            seeker={seeker}
                        />
                    )
                )}
            </div>
        </div>
    );
};

export default GamePage;
