import { Server, Socket } from 'socket.io';
import { MessageRepository } from '../services/storage/repository.js';

interface Participant {
  socketId: string;
  userId: string;
  name: string;
  avatar?: string;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
}

// Map: meetingId -> Map<socketId, Participant>
const meetingRooms = new Map<string, Map<string, Participant>>();

export const setupMeetingSockets = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    let currentMeetingId: string | null = null;
    let currentUser: Participant | null = null;

    // Join Meeting Room
    socket.on('join-room', ({ meetingId, userId, name, avatar }) => {
      currentMeetingId = meetingId;
      currentUser = {
        socketId: socket.id,
        userId: userId || socket.id,
        name: name || 'Participant',
        avatar,
        isAudioMuted: false,
        isVideoOff: false,
        isScreenSharing: false,
      };

      socket.join(meetingId);

      if (!meetingRooms.has(meetingId)) {
        meetingRooms.set(meetingId, new Map());
      }
      const room = meetingRooms.get(meetingId)!;

      // Existing participants in this meeting room
      const existingParticipants = Array.from(room.values());

      // Add new participant
      room.set(socket.id, currentUser);

      // Send existing participants to the joined user
      socket.emit('room-users', {
        participants: existingParticipants,
        myInfo: currentUser,
      });

      // Notify others in room
      socket.to(meetingId).emit('user-joined', {
        participant: currentUser,
      });

      console.log(`[Socket] ${currentUser.name} (${socket.id}) joined meeting ${meetingId}`);
    });

    // WebRTC Signaling: relay offer, answer, ICE candidates
    socket.on('signal-peer', ({ toSocketId, signal }) => {
      io.to(toSocketId).emit('signal-peer', {
        fromSocketId: socket.id,
        signal,
        senderInfo: currentUser,
      });
    });

    // Real-Time Chat Message
    socket.on('send-message', async ({ meetingId, text }) => {
      if (!currentUser) return;

      const message = await MessageRepository.create({
        meetingId,
        senderId: currentUser.userId,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        text,
      });

      io.to(meetingId).emit('receive-message', message);
    });

    // Typing indicator
    socket.on('typing', ({ meetingId, isTyping }) => {
      if (!currentUser) return;
      socket.to(meetingId).emit('user-typing', {
        userId: currentUser.userId,
        name: currentUser.name,
        isTyping,
      });
    });

    // Participant Media States
    socket.on('toggle-audio', ({ isAudioMuted }) => {
      if (currentUser && currentMeetingId) {
        currentUser.isAudioMuted = isAudioMuted;
        socket.to(currentMeetingId).emit('participant-audio-change', {
          socketId: socket.id,
          isAudioMuted,
        });
      }
    });

    socket.on('toggle-video', ({ isVideoOff }) => {
      if (currentUser && currentMeetingId) {
        currentUser.isVideoOff = isVideoOff;
        socket.to(currentMeetingId).emit('participant-video-change', {
          socketId: socket.id,
          isVideoOff,
        });
      }
    });

    socket.on('toggle-screen-share', ({ isScreenSharing }) => {
      if (currentUser && currentMeetingId) {
        currentUser.isScreenSharing = isScreenSharing;
        socket.to(currentMeetingId).emit('participant-screen-share-change', {
          socketId: socket.id,
          isScreenSharing,
        });
      }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      if (currentMeetingId && currentUser) {
        const room = meetingRooms.get(currentMeetingId);
        if (room) {
          room.delete(socket.id);
          if (room.size === 0) {
            meetingRooms.delete(currentMeetingId);
          }
        }
        socket.to(currentMeetingId).emit('user-left', {
          socketId: socket.id,
          userId: currentUser.userId,
          name: currentUser.name,
        });
        console.log(`[Socket] ${currentUser.name} left meeting ${currentMeetingId}`);
      }
    });
  });
};
