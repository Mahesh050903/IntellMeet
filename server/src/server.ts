import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { setupMeetingSockets } from './sockets/meetingSocket.js';

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const startServer = async () => {
  await connectDB();

  const app = createApp();
  const httpServer = http.createServer(app);

  const allowedOrigins = [
    'https://intellmeet.dpdns.org',
    'http://intellmeet.dpdns.org',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  if (CLIENT_URL) {
    const clean = CLIENT_URL.replace(/\/$/, '');
    if (!allowedOrigins.includes(clean)) allowedOrigins.push(clean);
  }

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
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
