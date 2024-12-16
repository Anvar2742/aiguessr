import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Replace with your client URL
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Handle sending letters
  socket.on("sendLetter", ({ content, recipientId }) => {
    console.log("cool")
    console.log(`Letter sent from ${socket.id} to ${recipientId}: ${content}`);
    io.to(recipientId).emit("receiveLetter", { content });
  });

  // Handle player disconnection
  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
  });
});

// Start the server
const PORT = 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
