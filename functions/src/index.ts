import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { getDatabase } from 'firebase-admin/database'; // Explicit import
import { Request, Response } from 'express';

const firebaseConfig = {
  apiKey: "AIzaSyDLEpapzE_aaPprvvu9I3NLxQngqwesXAs",
  authDomain: "aiguessr-v1.firebaseapp.com",
  // databaseURL: "https://aiguessr-v1-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "aiguessr-v1",
  storageBucket: "aiguessr-v1.firebasestorage.app",
  messagingSenderId: "181640497289",
  appId: "1:181640497289:web:ec33db88e68502eb9b9e58",
  measurementId: "G-V240NXPKX4",
  databaseURL: "http://127.0.0.1:5001/aiguessr-v1/us-central1/sendMessageToGPT"
};

const app = admin.initializeApp(firebaseConfig);
const db = getDatabase(app); // Initialize Realtime Database
const getChatKey = (from: string, to: string) => {
  return [from, to].sort((a, b) => a.localeCompare(b)).join('-').toLowerCase();
}


exports.sendMessageToGPT = onRequest(async (req: Request, res: Response): Promise<void> => {
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { message, userId, roomCode } = req.body;

    if (!message || !userId || !roomCode) {
      res.status(404).send('Missing required fields');
      return;
    }

    const gptResponse = await sendToChatGPT(message);


    await db.ref(`rooms/${roomCode}/messages`).push({
      chatKey: getChatKey("chatgpt", userId),
      from: 'ChatGPT',
      to: userId,
      message: gptResponse.reply,
      timestamp: Date.now(), // Using the explicitly imported ServerValue
    });
    // console.log("ServerValue content:", ServerValue);

    res.status(200).send(gptResponse);
  } catch (error) {
    console.error('Error sending message to GPT:', error);
    res.status(500).send('Error sending message to GPT');
  }
});

async function sendToChatGPT(message: string) {
  return { reply: 'This is a simulated GPT response to this message: ' + message }
}
