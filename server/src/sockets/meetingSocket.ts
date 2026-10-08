import { Server, Socket } from 'socket.io';
import { MessageRepository, MeetingRepository } from '../services/storage/repository.js';

interface Participant {
  socketId: string;
  userId: string;
  name: string;
  avatar?: string;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isHost?: boolean;
}

// Map: meetingId -> Map<socketId, Participant>
const meetingRooms = new Map<string, Map<string, Participant>>();

export const setupMeetingSockets = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    let currentMeetingId: string | null = null;
    let currentUser: Participant | null = null;

    // Join Meeting Room
    socket.on('join-room', ({ meetingId, userId, name, avatar, isHost }) => {
      currentMeetingId = meetingId;
      currentUser = {
        socketId: socket.id,
        userId: userId || socket.id,
        name: name || 'Participant',
        avatar,
        isAudioMuted: false,
        isVideoOff: false,
        isScreenSharing: false,
        isHost: !!isHost,
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

      // Ensure meeting status in DB is active
      MeetingRepository.update(meetingId, { status: 'active' }).catch(() => {});

      // Send existing participants to the joined user
      socket.emit('room-users', {
        participants: existingParticipants,
        myInfo: currentUser,
      });

      // Notify others in room
      socket.to(meetingId).emit('user-joined', {
        participant: currentUser,
      });

      console.log(`[Socket] ${currentUser.name} (${socket.id}) joined meeting ${meetingId} (Host: ${!!isHost})`);
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

    // Update dynamic participant metadata without reconnecting
    socket.on('update-user-meta', ({ isHost }: { isHost?: boolean }) => {
      if (currentUser && typeof isHost === 'boolean') {
        currentUser.isHost = isHost;
        const room = currentMeetingId ? meetingRooms.get(currentMeetingId) : null;
        if (room && room.has(socket.id)) {
          room.set(socket.id, currentUser);
        }
      }
    });

    // Host & Moderator Controls (Google Meet style permissions)
    socket.on('host-control', ({ targetSocketId, action }) => {
      if (!currentMeetingId) return;
      const byName = currentUser?.name || 'Host';

      if (action === 'mute-all') {
        socket.to(currentMeetingId).emit('force-mute', { byName });
      } else if (action === 'mute' && targetSocketId) {
        io.to(targetSocketId).emit('force-mute', { byName });
      } else if (action === 'stop-video' && targetSocketId) {
        io.to(targetSocketId).emit('force-stop-video', { byName });
      } else if (action === 'request-unmute' && targetSocketId) {
        io.to(targetSocketId).emit('request-unmute', { byName });
      } else if (action === 'request-video' && targetSocketId) {
        io.to(targetSocketId).emit('request-video', { byName });
      } else if (action === 'remove-user' && targetSocketId) {
        io.to(targetSocketId).emit('removed-from-meeting', { byName });
        const room = meetingRooms.get(currentMeetingId);
        if (room) {
          room.delete(targetSocketId);
          if (room.size === 0) {
            meetingRooms.delete(currentMeetingId);
            MeetingRepository.update(currentMeetingId, { status: 'ended', endTime: new Date() }).catch(() => {});
          }
        }
      }
    });

    // End Meeting for All (Host/Admin Action)
    socket.on('end-meeting', async ({ meetingId }) => {
      const targetId = meetingId || currentMeetingId;
      if (!targetId) return;

      const room = meetingRooms.get(targetId);
      if (room) {
        io.to(targetId).emit('meeting-ended', {
          meetingId: targetId,
          endedByName: currentUser?.name || 'Host',
        });
        meetingRooms.delete(targetId);
      }

      await MeetingRepository.update(targetId, {
        status: 'ended',
        endTime: new Date(),
      }).catch((err) => console.error('[Socket] End meeting error:', err));

      console.log(`[Socket] Meeting ${targetId} ended for all participants by ${currentUser?.name}`);
    });

    // Clean up leaving participant and auto-end room if 0 participants remain
    const handleLeaveRoom = async () => {
      if (currentMeetingId && currentUser) {
        const room = meetingRooms.get(currentMeetingId);
        if (room) {
          room.delete(socket.id);
          if (room.size === 0) {
            meetingRooms.delete(currentMeetingId);
            // Auto-end the meeting when 0 participants remain
            await MeetingRepository.update(currentMeetingId, {
              status: 'ended',
              endTime: new Date(),
            }).catch((err) => console.error('[Socket] Auto-end meeting error:', err));
            console.log(`[Socket] Meeting ${currentMeetingId} auto-ended (0 participants remaining)`);
          }
        }
        socket.to(currentMeetingId).emit('user-left', {
          socketId: socket.id,
          userId: currentUser.userId,
          name: currentUser.name,
        });
        console.log(`[Socket] ${currentUser.name} left meeting ${currentMeetingId}`);
      }
    };

    socket.on('leave-room', handleLeaveRoom);
    socket.on('disconnect', handleLeaveRoom);
  });
};
