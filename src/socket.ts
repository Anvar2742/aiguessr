// src/socket.ts
import { io } from 'socket.io-client';

export const socket = io('http://localhost:3000'); // Connect to your Socket.io server
