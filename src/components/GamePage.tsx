import { useEffect, useState } from 'react';
import { getFirestore, doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';  // Ensure correct imports
import { useParams } from 'react-router-dom';
import Chat from './Chat';
import { useAuth } from '../context/AuthContext';

// Your Firebase configuration and initialization should be here

const GamePage = () => {
    const { roomCode } = useParams();  // Assuming roomCode is passed via the URL params
    const [seeker, setSeeker] = useState<string | null>(null);
    const [players, setPlayers] = useState<string[]>([]);
    const db = getFirestore();  // Initialize Firestore
    const { user } = useAuth();

    useEffect(() => {
        const fetchGameData = async () => {
            if (roomCode) {
                try {
                    // Create a query to search for the room by name
                    const roomQuery = query(
                        collection(db, 'rooms'),   // Get reference to the 'rooms' collection
                        where('name', '==', roomCode)  // Filter by the 'name' field (which corresponds to roomCode)
                    );

                    // Execute the query
                    const querySnapshot = await getDocs(roomQuery);

                    if (!querySnapshot.empty) {
                        // If a room matching the name exists, get the first document
                        const roomDoc = querySnapshot.docs[0]; // Assuming roomCode is unique, take the first result
                        const roomData = roomDoc.data();  // Fetch data from the document
                        console.log(roomData);

                        if (roomData) {
                            // Assuming roomData contains 'seeker' and 'hiders' fields
                            setSeeker(roomData.seeker);  // Set the Seeker
                            setPlayers([...roomData.players]);  // Set the list of players
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

        return () => {
            // Cleanup if necessary
        };
    }, [roomCode, db]);

    return (
        <div>
            <h2>Game Room: {roomCode}</h2>
            {seeker && <h3>Seeker: {seeker}</h3>}
            <div>
                <h4>Players:</h4>
                {players.map((player, index) => player === user.email ? "" : (
                    <div key={index}>
                        <h5>{player + ' ' + index}</h5>
                        <Chat to={player} /> {/* Chat with each player */}
                    </div>
                ))}

                {/* Optionally, Chat with ChatGPT */}
                <h4>Chat with ChatGPT</h4>
                <Chat to="ChatGPT" /> {/* Chat with ChatGPT */}
            </div>
        </div>
    );
};

export default GamePage;
