import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { db } from './firebase';  // Assuming you have Firebase setup in `firebase.ts`
import { doc, deleteDoc, updateDoc, arrayUnion, setDoc, getDoc, query, where, getDocs, collection } from 'firebase/firestore';

// Create an Express app
const app = express();

// Use CORS middleware to allow connections from your frontend (React app)
app.use(cors({
    origin: 'http://localhost:5173', // React app URL
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

// Create an HTTP server
const server = http.createServer(app);

// Create a Socket.IO server and allow CORS for WebSocket connections
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173', // React app URL
        methods: ['GET', 'POST'],
    },
});

let players: { [key: string]: { email: string; roomCode: string | null; status: string } } = {}; // Track player status and room
let gameStarted: boolean = false;
let seeker: string | null = null;

io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);

    // When a player joins the room (in the lobby page)
    socket.on('join-room', (email, roomCode) => {
        players[socket.id] = { email, roomCode, status: 'connected' }; // Save player status as 'connected'
        io.emit('player-status', { email, roomCode, status: 'connected' }); // Emit player status to all clients
        console.log(`${email} joined the room ${roomCode}`);
    });

    // Listen for 'start-game' event to start the game
    socket.on('start-game', async (roomCode) => {        
        if (!gameStarted) {
            // Randomly select a Seeker from the players
            const playerArray = Object.values(players);
            const randomPlayer = playerArray[Math.floor(Math.random() * playerArray.length)];
            seeker = randomPlayer.email;

            // Notify all players that the game has started and who the Seeker is
            io.emit('game-started', { seeker, roomCode });

            // Query Firestore to find the room by the `name` field
            const roomQuery = query(
                collection(db, 'rooms'),   // Firestore collection reference
                where('name', '==', roomCode)  // Search by the name field (roomCode)
            );

            const querySnapshot = await getDocs(roomQuery);

            if (!querySnapshot.empty) {
                // If a room matching the name exists, update it
                
                const roomDoc = querySnapshot.docs[0];  // Get the first matching document
                const roomRef = doc(db, 'rooms', roomDoc.id);  // Get the reference to the document

                // Update the document with the Seeker and Hiders
                const playerArray = Object.values(players);
                await updateDoc(roomRef, {
                    seeker: seeker,
                    hiders: playerArray.filter(player => player.email !== seeker).map(player => player.email),
                    gameStarted: true,
                });

                // Mark the game as started
                gameStarted = true;
            } else {
                // Room does not exist, log a warning or return an error
                console.error('Room not found with the name:', roomCode);
            }
        }
    });

    // Listen for 'leave-lobby' event when the player leaves the lobby
    socket.on('leave-lobby', async (email) => {
        const player = players[socket.id];
        if (player && player.roomCode) {
            // Make sure roomCode is valid before attempting to delete the document
            const playerRef = doc(db, 'rooms', player.roomCode); // Get the Firestore reference to the room
            await deleteDoc(playerRef);  // Delete the player's room or entry from Firestore

            // Emit player status change to all clients
            io.emit('player-status', { email: player.email, status: 'disconnected' });

            delete players[socket.id]; // Remove the player from the players list
        }
    });
 
    // Handle player disconnection
    socket.on('disconnect', () => {
        const player = players[socket.id];
        if (player) {
            io.emit('player-status', { email: player.email, status: 'disconnected' }); // Emit status when a player disconnects
            delete players[socket.id]; // Remove the player from the players list
        }
    });

    // Handle sending messages to a specific player or ChatGPT
    socket.on('send-message', (message, from, to) => {
        console.log(message, to);
        
        io.emit('receive-message', { message, from: from.email, to });
    });

    // Handle chat with ChatGPT
    socket.on('chatgpt-message', (message) => {
        io.emit('chatgpt-response', { message, from: 'ChatGPT' });
    });

});
 
// Start the server on port 3000
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
