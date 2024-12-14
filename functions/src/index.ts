import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { Database, getDatabase } from 'firebase-admin/database'; // Explicit import
import { Request, Response } from 'express';
import axios from 'axios';
import { getFirestore } from 'firebase-admin/firestore';
import { theQuestionPrompts } from './prompts';
require('dotenv').config();

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyATHUXAFdVoaFZqTncmorQcmW0OdaWAgic",
  authDomain: "aiguessr-vf.firebaseapp.com",
  databaseURL: "https://aiguessr-vf-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "aiguessr-vf",
  storageBucket: "aiguessr-vf.firebasestorage.app",
  messagingSenderId: "483659388718",
  appId: "1:483659388718:web:dbbb911107ce5fc1224cbf",
  measurementId: "G-TLTL3RZVWX"
};

if (!admin.apps.length) {

}
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Replace with your OpenAI API key
const isLocalhost = process.env.ENVIRONMENT_KEY === 'dev';
if (!admin.apps.length) {
  admin.initializeApp(
    isLocalhost
      ? {
        apiKey: "AIzaSyATHUXAFdVoaFZqTncmorQcmW0OdaWAgic",
        authDomain: "aiguessr-vf.firebaseapp.com",
        projectId: "aiguessr-vf",
        storageBucket: "aiguessr-vf.firebasestorage.app",
        messagingSenderId: "483659388718",
        appId: "1:483659388718:web:dbbb911107ce5fc1224cbf",
        measurementId: "G-TLTL3RZVWX",
        databaseURL: 'http://127.0.0.1:9000/?ns=aiguessr-vf-default-rtdb', // Local emulator URL
      }
      : firebaseConfig // Default to production configuration
  );
}


const db = getDatabase(); // Initialize Realtime Database

// Helper function to generate a unique chat key
const getChatKey = (from: string, to: string): string => {
  return [from, to].sort((a, b) => a.localeCompare(b)).join('-').toLowerCase();
};

const cors = isLocalhost ? "http://localhost:3000" : "https://aiguessr-vf.web.app"

exports.sendMessageToGPT = onRequest({ cors, region: "europe-west1" }, async (req: Request, res: Response): Promise<void> => {
  // Handle preflight OPTIONS request for CORS
  res.set('Access-Control-Allow-Origin', cors);
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).send(''); // No content for preflight
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed'); // Only POST requests allowed
    return;
  }

  try {
    const { message, userId, roomCode } = req.body;

    if (!message || !userId || !roomCode) {
      res.status(400).send({ error: 'Missing required fields: message, userId, or roomCode' });
      return;
    }
    console.log(message);

    // Simulate GPT API call
    const gptResponse = await sendToChatGPT(message);

    await db.ref(`rooms/${roomCode}/messages`).push({
      chatKey: getChatKey('chatgpt', userId),
      from: 'ChatGPT',
      to: userId,
      message: gptResponse.reply,
      timestamp: Date.now(), // Ensure consistent timestamp
    });

    // console.log(result);


    res.status(200).send(gptResponse);
  } catch (error: any) {
    console.error('Error sending message to GPT:', error);
    res.status(500).send({ error: 'Internal Server Error', details: error?.message });
  }
});

// Helper function to simulate GPT response
async function sendToChatGPT(message: string): Promise<{ reply: string }> {
  const endpoint = 'https://api.openai.com/v1/chat/completions';

  try {
    // Simulate per-character typing for the user's message
    // console.log("User is typing...");
    for (const _char of message) {
      const charDelay = Math.random() * (300 - 200) + 200; // Random delay between 5ms and 15ms
      await new Promise((resolve) => setTimeout(resolve, charDelay));
    }
    // console.log("User finished typing.");

    // Simulate ChatGPT "thinking" delay
    // const thinkingDelay = 2500 + Math.random() * 4000; // Random delay between 1s to 2s
    const thinkingDelay = 5000 // Random delay between 1s to 2s
    await new Promise((resolve) => setTimeout(resolve, thinkingDelay));

    // Fetch the system prompt
    const snapshot = await db.ref('chatGPT/prompt').once('value');
    const prompt = snapshot.val();
    // console.log((Math.random() * (1.4 - 1.0) + 1.0).toFixed(2));


    // Send the user's message to the ChatGPT API
    const response = await axios.post(
      endpoint,
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: message },
        ],
        max_tokens: 150,
        temperature: +((Math.random() * (1.2 - 1.0) + 1.05).toFixed(2)),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    // Get ChatGPT's reply
    const reply = response.data.choices[0]?.message?.content.trim() || 'No response from ChatGPT';

    // Simulate per-character typing for ChatGPT's reply
    // console.log("ChatGPT is typing...");
    for (const _char of reply) {
      const charDelay = Math.random() * (300 - 200) + 200; // Random delay between 5ms and 15ms
      await new Promise((resolve) => setTimeout(resolve, charDelay));
    }
    // console.log("ChatGPT finished typing.");

    return { reply };
  } catch (error: any) {
    console.error('Error communicating with OpenAI API:', error.response?.data || error.message);
    throw new Error('Failed to fetch response from ChatGPT API');
  }
}


exports.getPrompt = onRequest({ cors, region: "europe-west1" }, async (req, res) => {

  res.set('Access-Control-Allow-Origin', cors);
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  try {
    const snapshot = await db.ref('chatGPT/prompt').once('value');
    const prompt = snapshot.val();
    res.status(200).send({ prompt });
  } catch (error) {
    console.error('Error fetching prompt:', error);
    res.status(500).send({ error: 'Failed to fetch prompt' });
  }
});

exports.updatePrompt = onRequest({ cors, region: "europe-west1" }, async (req, res) => {

  res.set('Access-Control-Allow-Origin', cors);
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method !== 'POST') {
    res.status(405).send({ error: 'Method Not Allowed' });
    return;
  }

  const { newPrompt } = req.body;

  if (!newPrompt) {
    res.status(400).send({ error: 'Missing newPrompt field' });
    return;
  }

  try {
    await db.ref('chatGPT/prompt').set(newPrompt);
    res.status(200).send({ message: 'Prompt updated successfully' });
  } catch (error) {
    console.error('Error updating prompt:', error);
    res.status(500).send({ error: 'Failed to update prompt' });
  }
});

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}


exports.theQuestionGPT = onRequest({ cors: true, region: "europe-west1" }, async (req: Request, res: Response): Promise<void> => {
  // Handle preflight OPTIONS request for CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send(''); // No content for preflight
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed'); // Only POST requests allowed
    return;
  }

  try {
    const db = getFirestore();
    const rtdb = getDatabase();

    const { input, email, fingerprint, username } = req.body;

    console.log("Request body:", req.body);

    if (!input || !email || !fingerprint || !username) {
      res.status(400).send({
        error: 'Missing required fields: input, email, fingerprint, or username'
      });
      return;
    }

    // Get answer from GPT
    const gptResponse = await theAnswerGPT(input);
    const parsedReply = JSON.parse(gptResponse.reply);

    const timestamp = Date.now();

    // Save input, email, username, and GPT response to Firestore
    await db.collection('userInputs').add({
      email,
      input,
      username,
      gptResponse: parsedReply,
      totalPoints: parsedReply["totalPoints"],
      timestamp
    });

    // Save fingerprint with a timestamp to Firestore
    await db.collection('fingerprints').doc(fingerprint).set({
      timestamp
    });

    // Save subset of data to RTDB (no email)
    const rtdbRef = rtdb.ref('userInputs').push();
    await rtdbRef.set({
      input,
      username,
      fingerprint,
      gptResponse: parsedReply,
      totalPoints: parsedReply["totalPoints"],
      timestamp
    });

    res.status(200).send(gptResponse);
  } catch (error: any) {
    console.error('Error handling request:', error);
    res.status(500).send({
      error: 'Internal Server Error',
      details: error?.message || 'No error message available'
    });
  }
});



async function theAnswerGPT(input: string): Promise<{ reply: string }> {
  const endpoint = 'https://api.openai.com/v1/chat/completions';

  try {
    const prompts = theQuestionPrompts;

    // Randomly select a prompt
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    // Send the user's message to the ChatGPT API
    const response = await axios.post(
      endpoint,
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: randomPrompt },
          { role: 'user', content: input },
        ],
        // max_tokens: 150,
        temperature: 0,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    // Get ChatGPT's reply
    const reply = response.data.choices[0]?.message?.content.trim() || 'No response from ChatGPT';



    return { reply };
  } catch (error: any) {
    console.error('Error communicating with OpenAI API:', error.response?.data || error.message);
    throw new Error('Failed to fetch response from ChatGPT API');
  }
}


