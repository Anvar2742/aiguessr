// src/functions/index.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import axios from 'axios';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

const app = express();

// Use CORS middleware to allow connections from your frontend
app.use(cors({
    origin: 'http://localhost:5173', // Replace with your frontend URL
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// Sample players, game state tracking (This will reset every time the function is re-deployed)
let players: { [key: string]: { email: string; roomCode: string | null; status: string } } = {};
let gameStarted: boolean = false;
let seeker: string | null = null;

// Route to handle game start
app.post('/start-game', async (req, res) => {
    const { roomCode } = req.body;

    if (!gameStarted) {
        const playerArray = Object.values(players);
        const randomPlayer = playerArray[Math.floor(Math.random() * playerArray.length)];
        seeker = randomPlayer.email;

        // Notify all clients of game start (use Firebase Realtime Database or Firestore instead of WebSockets)
        const roomQuery = db.collection('rooms').where('name', '==', roomCode);
        const querySnapshot = await roomQuery.get();

        if (!querySnapshot.empty) {
            const roomDoc = querySnapshot.docs[0];
            const roomRef = roomDoc.ref;

            await roomRef.update({
                seeker: seeker,
                hiders: playerArray.filter(player => player.email !== seeker).map(player => player.email),
                gameStarted: true,
            });

            gameStarted = true;
            res.json({ message: 'Game started', seeker, roomCode });
        } else {
            console.error('Room not found with the name:', roomCode);
            res.status(404).send('Room not found');
        }
    } else {
        res.status(400).send('Game already started');
    }
});

// ChatGPT endpoint for interacting with OpenAI API
app.post('/chatgpt', async (req, res) => {
    const { message } = req.body;
    const apiKey = functions.config().openai.key;  // Using Firebase Functions config

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: message }],
            max_tokens: 150,
            temperature: 0.7,
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        const gptResponse = response.data.choices[0].message.content;
        res.json({ message: gptResponse });
    } catch (error) {
        console.error('Error interacting with the ChatGPT API:', error);
        res.status(500).send('Error interacting with ChatGPT API');
    }
});

// Player join room
app.post('/join-room', (req, res) => {
    const { email, roomCode } = req.body;
    players[email] = { email, roomCode, status: 'connected' };
    res.json({ message: `${email} joined room ${roomCode}` });
});

// Player leave room
app.post('/leave-room', async (req, res) => {
    const { email, roomCode } = req.body;

    if (players[email]) {
        delete players[email];
        const roomRef = db.collection('rooms').doc(roomCode);
        await roomRef.delete();
        res.json({ message: `${email} left room ${roomCode}` });
    } else {
        res.status(404).send('Player not found');
    }
});

// Export the API as a Firebase function
export const api = functions.https.onRequest(app);
