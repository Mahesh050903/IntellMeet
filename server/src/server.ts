import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { setupMeetingSockets } from './sockets/meetingSocket.js';

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const startServer = async () => {
  // Connect to DB
  await connectDB();

  const app = createApp();
  const httpServer = http.createServer(app);

  // Setup Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  setupMeetingSockets(io);

  httpServer.listen(PORT, () => {
    console.log(`[Server] IntellMeet Server running on port ${PORT}`);
    console.log(`[Server] Socket.io signaling engine ready for real-time video/chat`);
  });
};

startServer().catch((err) => {
  console.error('[Server] Fatal startup failure:', err);
  process.exit(1);
});
