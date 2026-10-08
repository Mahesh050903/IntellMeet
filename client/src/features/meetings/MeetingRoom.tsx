import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiFetch } from '../../api/client.js';
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, ScreenShare, PhoneOff,
  MessageSquare, Sparkles, Send, Users, CheckCircle, ArrowRight, Copy, Check,
  AlertCircle, X, RefreshCw
} from 'lucide-react';

interface MeetingRoomProps {
  meetingId: string;
  meetingTitle: string;
  currentUser: any;
  onLeaveMeeting: () => void;
  onOpenKanban: () => void;
}

const RemoteParticipantVideo: React.FC<{
  peer: any;
  stream?: MediaStream;
  isHost?: boolean;
  onHostControl?: (targetSocketId: string, action: string) => void;
}> = ({ peer, stream, isHost, onHostControl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [stream, peer.isVideoOff]);

  const hasVideo = stream && stream.getVideoTracks().some((t) => t.enabled && t.readyState === 'live') && !peer.isVideoOff;

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        background: '#111827',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        aspectRatio: '16/9',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: hasVideo ? 'block' : 'none',
        }}
      />

      {!hasVideo && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              fontWeight: 700,
              color: '#ffffff',
              boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)',
            }}
          >
            {peer.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span style={{ color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 500 }}>{peer.name}</span>
          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Camera off</span>
        </div>
      )}

      {/* Host Quick Moderation Controls on Participant Card */}
      {isHost && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            padding: '4px 8px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 10,
          }}
        >
          {peer.isAudioMuted ? (
            <button
              onClick={() => onHostControl?.(peer.socketId, 'request-unmute')}
              title="Ask participant to unmute"
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '5px',
                color: '#34d399',
                padding: '4px 6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Mic size={13} />
            </button>
          ) : (
            <button
              onClick={() => onHostControl?.(peer.socketId, 'mute')}
              title="Mute participant"
              style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: '5px',
                color: '#fb7185',
                padding: '4px 6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <MicOff size={13} />
            </button>
          )}

          {peer.isVideoOff ? (
            <button
              onClick={() => onHostControl?.(peer.socketId, 'request-video')}
              title="Ask participant to start camera"
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '5px',
                color: '#34d399',
                padding: '4px 6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <VideoIcon size={13} />
            </button>
          ) : (
            <button
              onClick={() => onHostControl?.(peer.socketId, 'stop-video')}
              title="Turn off participant camera"
              style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: '5px',
                color: '#fb7185',
                padding: '4px 6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <VideoOff size={13} />
            </button>
          )}

          <button
            onClick={() => {
              if (window.confirm(`Remove ${peer.name} from the meeting?`)) {
                onHostControl?.(peer.socketId, 'remove-user');
              }
            }}
            title="Remove from meeting"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '5px',
              color: '#f87171',
              padding: '4px 6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          padding: '4px 10px',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: '#f8fafc',
        }}
      >
        <span>{peer.name}</span>
        {peer.isAudioMuted && <span title="Microphone muted"><MicOff size={13} color="#f87171" /></span>}
        {peer.isVideoOff && <span title="Camera turned off"><VideoOff size={13} color="#f87171" /></span>}
        {peer.isScreenSharing && <ScreenShare size={13} color="#38bdf8" />}
      </div>
    </div>
  );
};

export const MeetingRoom: React.FC<MeetingRoomProps> = ({
  meetingId,
  meetingTitle,
  currentUser,
  onLeaveMeeting,
  onOpenKanban,
}) => {
  // Media States
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [pluggedDevices, setPluggedDevices] = useState<{
    hasCamera: boolean;
    hasMic: boolean;
    cameraCount: number;
    micCount: number;
  }>({ hasCamera: true, hasMic: true, cameraCount: 0, micCount: 0 });

  // Host & Meeting Information
  const [isHost, setIsHost] = useState(false);
  const [permissionPrompt, setPermissionPrompt] = useState<{
    type: 'audio' | 'video';
    message: string;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Panels & Views
  const [activeSidePanel, setActiveSidePanel] = useState<'chat' | 'ai' | 'participants' | null>('chat');

  // Chat & Socket
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  // WebRTC Mesh State
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

  // AI & Transcript State
  const [transcript, setTranscript] = useState<string>(
    `Alex: Good morning team, let's review our quarterly roadmap and architecture.\n` +
    `Sarah: I propose we complete the WebRTC mesh audio/video signaling by Wednesday.\n` +
    `David: Agreed! We finalized the backend integration with Socket.io and MongoDB.\n` +
    `Alex: Excellent. Sarah will draft the automated CI/CD pipeline, and David will optimize database indexing.\n` +
    `Sarah: We decided to deploy the staging environment using Docker Compose.`
  );
  const [aiSummary, setAiSummary] = useState<any | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [tasksCreated, setTasksCreated] = useState(false);

  // Video Refs & Peer Connections Map
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const candidateQueueRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  // ICE Server Configuration (STUN with optional production TURN)
  const getIceServers = (): RTCIceServer[] => {
    const servers: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ];
    const customTurnUrl = (import.meta as any).env?.VITE_TURN_URL;
    const customTurnUser = (import.meta as any).env?.VITE_TURN_USERNAME;
    const customTurnCred = (import.meta as any).env?.VITE_TURN_CREDENTIAL;
    if (customTurnUrl) {
      servers.push({
        urls: customTurnUrl,
        username: customTurnUser,
        credential: customTurnCred,
      });
    }
    return servers;
  };

  // Close and cleanup a single peer connection
  const cleanupPeer = (socketId: string) => {
    const pc = peerConnectionsRef.current.get(socketId);
    if (pc) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.close();
      peerConnectionsRef.current.delete(socketId);
    }
    candidateQueueRef.current.delete(socketId);
    setRemoteStreams((prev) => {
      const updated = { ...prev };
      delete updated[socketId];
      return updated;
    });
  };

  // Create an RTCPeerConnection for a remote peer
  const createPeerConnection = (remoteSocketId: string, isInitiator: boolean): RTCPeerConnection => {
    if (peerConnectionsRef.current.has(remoteSocketId)) {
      return peerConnectionsRef.current.get(remoteSocketId)!;
    }

    const pc = new RTCPeerConnection({
      iceServers: getIceServers(),
      iceCandidatePoolSize: 10,
    });

    // Add local tracks if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('signal-peer', {
          toSocketId: remoteSocketId,
          signal: {
            type: 'candidate',
            candidate: event.candidate.toJSON ? event.candidate.toJSON() : event.candidate,
          },
        });
      }
    };

    // Incoming remote media tracks
    pc.ontrack = (event) => {
      const incomingStream = event.streams[0] || new MediaStream([event.track]);
      setRemoteStreams((prev) => ({
        ...prev,
        [remoteSocketId]: incomingStream,
      }));
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === 'disconnected' ||
        pc.connectionState === 'failed' ||
        pc.connectionState === 'closed'
      ) {
        cleanupPeer(remoteSocketId);
      }
    };

    peerConnectionsRef.current.set(remoteSocketId, pc);

    // If initiator, create and send SDP offer
    if (isInitiator) {
      pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          socketRef.current?.emit('signal-peer', {
            toSocketId: remoteSocketId,
            signal: {
              type: 'offer',
              sdp: pc.localDescription?.sdp,
            },
          });
        })
        .catch((err) => console.error('[WebRTC] Offer creation error:', err));
    }

    return pc;
  };

  // Detect plugged-in hardware devices (webcams, microphones, headsets)
  const checkPluggedDevices = async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      const audioInputs = devices.filter((d) => d.kind === 'audioinput');
      setPluggedDevices({
        hasCamera: videoInputs.length > 0,
        hasMic: audioInputs.length > 0,
        cameraCount: videoInputs.length,
        micCount: audioInputs.length,
      });
    } catch (err) {
      console.warn('[Devices] Hardware check error:', err);
    }
  };

  useEffect(() => {
    checkPluggedDevices();
    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', checkPluggedDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', checkPluggedDevices);
      };
    }
  }, []);

  // Ensure local video element stays actively attached and playing whenever video is ON
  useEffect(() => {
    if (localVideoRef.current && localStream && !isVideoOff) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      localVideoRef.current.play().catch((err) => {
        console.warn('[MeetingRoom] Local video play error:', err);
      });
    }
  }, [localStream, isVideoOff]);

  // Replace video track across all active peer connections (e.g. for screen sharing or camera toggle)
  const replaceVideoTrack = (newTrack: MediaStreamTrack | null) => {
    peerConnectionsRef.current.forEach((pc) => {
      const senders = pc.getSenders();
      const videoSender = senders.find((s) => (s.track && s.track.kind === 'video') || (s as any).kind === 'video');
      if (videoSender && newTrack) {
        videoSender.replaceTrack(newTrack).catch((err) => console.warn('[WebRTC] Track replace error:', err));
      } else if (!videoSender && newTrack && localStreamRef.current) {
        try {
          pc.addTrack(newTrack, localStreamRef.current);
        } catch (e) {
          console.warn('[WebRTC] pc.addTrack error:', e);
        }
      }
    });
  };

  // Replace audio track across all active peer connections
  const replaceAudioTrack = (newTrack: MediaStreamTrack | null) => {
    peerConnectionsRef.current.forEach((pc) => {
      const senders = pc.getSenders();
      const audioSender = senders.find((s) => (s.track && s.track.kind === 'audio') || (s as any).kind === 'audio');
      if (audioSender && newTrack) {
        audioSender.replaceTrack(newTrack).catch((err) => console.warn('[WebRTC] Audio track replace error:', err));
      } else if (!audioSender && newTrack && localStreamRef.current) {
        try {
          pc.addTrack(newTrack, localStreamRef.current);
        } catch (e) {
          console.warn('[WebRTC] pc.addTrack error:', e);
        }
      }
    });
  };

  // Setup Local Media Stream with plugged-in device support and graceful device fallback
  const initMedia = async () => {
    setMediaError(null);
    await checkPluggedDevices();
    let stream: MediaStream | null = null;

    try {
      // 1. Try acquiring both camera and microphone with 720p ideal
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
    } catch (combinedErr: any) {
      console.warn('[Media] Combined request failed, trying separate video and audio streams...', combinedErr);

      // 2. Try acquiring video (with 720p or fallback to basic video: true for any plugged-in webcam)
      let videoStream: MediaStream | null = null;
      try {
        videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } catch {
        try {
          videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (vErr) {
          console.warn('[Media] Standalone camera access failed:', vErr);
        }
      }

      // 3. Try acquiring audio
      let audioStream: MediaStream | null = null;
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (aErr) {
        console.warn('[Media] Standalone microphone access failed:', aErr);
      }

      if (videoStream && audioStream) {
        stream = videoStream;
        audioStream.getAudioTracks().forEach((track) => stream!.addTrack(track));
      } else if (videoStream) {
        stream = videoStream;
      } else if (audioStream) {
        stream = audioStream;
      } else {
        // Both camera and mic failed or blocked
        console.warn('[Media] All media device attempts failed:', combinedErr);
        if (combinedErr.name === 'NotAllowedError' || combinedErr.name === 'PermissionDeniedError') {
          setMediaError('Camera & microphone permissions are blocked. Click the 🔒 lock icon in your URL bar, allow Camera & Microphone, and click Retry.');
        } else if (combinedErr.name === 'NotFoundError' || combinedErr.name === 'DevicesNotFoundError') {
          setMediaError('No plugged-in webcam or microphone found. Please connect your camera/mic and click Retry.');
        } else {
          setMediaError(`Media device issue: ${combinedErr.message || 'Device busy or unavailable'}. Ensure no other app is using your webcam.`);
        }
        setIsVideoOff(true);
        setIsAudioMuted(true);
        return;
      }
    }

    localStreamRef.current = stream;
    setLocalStream(stream);

    const hasVideo = stream.getVideoTracks().length > 0;
    const hasAudio = stream.getAudioTracks().length > 0;

    if (localVideoRef.current && hasVideo) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch(() => {});
    }

    setIsVideoOff(!hasVideo);
    setIsAudioMuted(!hasAudio);
    setMediaError(null);

    // Attach tracks to any already-opened peer connections
    peerConnectionsRef.current.forEach((pc) => {
      stream!.getTracks().forEach((track) => {
        const alreadySending = pc.getSenders().some((s) => s.track?.kind === track.kind);
        if (!alreadySending) {
          try {
            pc.addTrack(track, stream!);
          } catch (e) {
            console.warn('[WebRTC] pc.addTrack error:', e);
          }
        }
      });
    });
  };

  useEffect(() => {
    initMedia();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      candidateQueueRef.current.clear();
    };
  }, []);

  // Check host status from backend meeting record
  useEffect(() => {
    apiFetch(`/meetings/${meetingId}`).then((res) => {
      if (res.success && res.data?.meeting) {
        const m = res.data.meeting;
        const hostCheck =
          m.hostId === currentUser?.id ||
          currentUser?.role === 'admin' ||
          currentUser?.role === 'host';
        setIsHost(hostCheck);
        if (socketRef.current) {
          socketRef.current.emit('update-user-meta', { isHost: hostCheck });
        }
      }
    });
  }, [meetingId, currentUser?.id]);

  // Auto-dismiss floating toast notifications
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Host Moderation Actions
  const handleHostControl = (targetSocketId: string, action: string) => {
    socketRef.current?.emit('host-control', { targetSocketId, action });
  };

  const handleEndMeetingForAll = () => {
    if (window.confirm('Are you sure you want to end this live meeting for everyone? All participants will be disconnected.')) {
      socketRef.current?.emit('end-meeting', { meetingId });
      onLeaveMeeting();
    }
  };

  const handleMuteAll = () => {
    socketRef.current?.emit('host-control', { action: 'mute-all' });
    setToastMessage('Requested all participants to be muted.');
  };

  // Setup Socket.io Connection & WebRTC Signaling Relay
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || '/';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.emit('join-room', {
      meetingId,
      userId: currentUser?.id || 'guest',
      name: currentUser?.name || 'Guest User',
      avatar: currentUser?.avatar,
      isHost,
    });

    socket.on('room-users', ({ participants: existingPeers }) => {
      setParticipants(existingPeers || []);
      // Newcomer initiates WebRTC P2P connection to all existing participants
      existingPeers?.forEach((peer: any) => {
        if (peer.socketId !== socket.id) {
          createPeerConnection(peer.socketId, true);
        }
      });
    });

    socket.on('user-joined', ({ participant }) => {
      setParticipants((prev) => [...prev.filter((p) => p.socketId !== participant.socketId), participant]);
    });

    socket.on('user-left', ({ socketId }) => {
      cleanupPeer(socketId);
      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
    });

    // WebRTC Signaling: Handle Offer, Answer, and ICE Candidates
    socket.on('signal-peer', async ({ fromSocketId, signal }) => {
      try {
        let pc = peerConnectionsRef.current.get(fromSocketId);

        if (signal.type === 'offer') {
          if (!pc) {
            pc = createPeerConnection(fromSocketId, false);
          }
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));

          // Attach local tracks if not already added
          if (localStreamRef.current && pc.getSenders().length === 0) {
            localStreamRef.current.getTracks().forEach((track) => {
              pc?.addTrack(track, localStreamRef.current!);
            });
          }

          // Process any queued candidates for this peer
          const queue = candidateQueueRef.current.get(fromSocketId) || [];
          for (const cand of queue) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (candErr) {
              console.warn('[WebRTC] Error adding queued ICE candidate:', candErr);
            }
          }
          candidateQueueRef.current.delete(fromSocketId);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socketRef.current?.emit('signal-peer', {
            toSocketId: fromSocketId,
            signal: {
              type: 'answer',
              sdp: pc.localDescription?.sdp,
            },
          });
        } else if (signal.type === 'answer') {
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));

            // Process any queued candidates
            const queue = candidateQueueRef.current.get(fromSocketId) || [];
            for (const cand of queue) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch (candErr) {
                console.warn('[WebRTC] Error adding queued ICE candidate:', candErr);
              }
            }
            candidateQueueRef.current.delete(fromSocketId);
          }
        } else if (signal.type === 'candidate' && signal.candidate) {
          if (pc && pc.remoteDescription && pc.remoteDescription.type) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } catch (candErr) {
              console.warn('[WebRTC] Error adding ICE candidate:', candErr);
            }
          } else {
            // Queue candidate until remote description is set
            const queue = candidateQueueRef.current.get(fromSocketId) || [];
            queue.push(signal.candidate);
            candidateQueueRef.current.set(fromSocketId, queue);
          }
        }
      } catch (err) {
        console.error('[WebRTC] Signaling dispatch failed:', err);
      }
    });

    // Real-Time Participant Media State Changes
    socket.on('participant-audio-change', ({ socketId, isAudioMuted }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.socketId === socketId ? { ...p, isAudioMuted } : p))
      );
    });

    socket.on('participant-video-change', ({ socketId, isVideoOff }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.socketId === socketId ? { ...p, isVideoOff } : p))
      );
    });

    socket.on('participant-screen-share-change', ({ socketId, isScreenSharing }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.socketId === socketId ? { ...p, isScreenSharing } : p))
      );
    });

    // Host & Admin Remote Controls Listeners (Google Meet style)
    socket.on('meeting-ended', ({ endedByName }) => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      alert(`The live meeting was ended for all participants by ${endedByName || 'the host'}.`);
      onLeaveMeeting();
    });

    socket.on('force-mute', ({ byName }) => {
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((t) => {
          t.enabled = false;
        });
      }
      setIsAudioMuted(true);
      socket.emit('toggle-audio', { isAudioMuted: true });
      setToastMessage(`${byName || 'The host'} muted your microphone.`);
    });

    socket.on('force-stop-video', ({ byName }) => {
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => {
          t.enabled = false;
        });
      }
      setIsVideoOff(true);
      socket.emit('toggle-video', { isVideoOff: true });
      setToastMessage(`${byName || 'The host'} turned off your camera.`);
    });

    socket.on('request-unmute', ({ byName }) => {
      setPermissionPrompt({
        type: 'audio',
        message: `${byName || 'The host'} has asked you to unmute your microphone.`,
      });
    });

    socket.on('request-video', ({ byName }) => {
      setPermissionPrompt({
        type: 'video',
        message: `${byName || 'The host'} has asked you to turn on your camera.`,
      });
    });

    socket.on('removed-from-meeting', ({ byName }) => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      alert(`You were removed from this meeting by ${byName || 'the host'}.`);
      onLeaveMeeting();
    });

    socket.on('receive-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('user-typing', ({ name, isTyping }) => {
      if (isTyping) {
        setTypingUser(name);
        setTimeout(() => setTypingUser(null), 3000);
      } else {
        setTypingUser(null);
      }
    });

    // Load past chat messages from DB
    apiFetch(`/meetings/${meetingId}/messages`).then((res) => {
      if (res.success && res.data?.messages) {
        setMessages(res.data.messages);
      }
    });

    return () => {
      try {
        socket.emit('leave-room');
      } catch {}
      socket.disconnect();
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      candidateQueueRef.current.clear();
    };
  }, [meetingId, currentUser?.id]);

  // Toggle Media Controls with on-demand device acquisition and track replacement
  const toggleAudio = async () => {
    if (isAudioMuted) {
      const existingTrack = localStreamRef.current?.getAudioTracks().find((t) => t.readyState === 'live');
      if (existingTrack) {
        existingTrack.enabled = true;
        setIsAudioMuted(false);
        setMediaError(null);
        replaceAudioTrack(existingTrack);
        socketRef.current?.emit('toggle-audio', { isAudioMuted: false });
        return;
      }

      // Remove any dead/ended audio tracks
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((t) => {
          localStreamRef.current!.removeTrack(t);
          try { t.stop(); } catch {}
        });
      }

      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newTrack = audioStream.getAudioTracks()[0];
        if (!newTrack) throw new Error('No audio track available');

        if (localStreamRef.current) {
          localStreamRef.current.addTrack(newTrack);
        } else {
          localStreamRef.current = new MediaStream([newTrack]);
        }

        setLocalStream(localStreamRef.current);
        setIsAudioMuted(false);
        setMediaError(null);
        replaceAudioTrack(newTrack);
        socketRef.current?.emit('toggle-audio', { isAudioMuted: false });
      } catch (err: any) {
        console.warn('[Media] Microphone request failed:', err);
        setIsAudioMuted(true);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setMediaError('Microphone permission blocked. Click the lock icon in the URL bar to allow microphone access.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setMediaError('No plugged-in microphone detected. Please plug in a microphone.');
        } else {
          setMediaError(`Microphone access error: ${err.message || 'Device unavailable'}`);
        }
      }
    } else {
      setIsAudioMuted(true);
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((t) => {
          t.enabled = false;
        });
      }
      socketRef.current?.emit('toggle-audio', { isAudioMuted: true });
    }
  };

  const toggleVideo = async () => {
    if (isVideoOff) {
      const existingTrack = localStreamRef.current?.getVideoTracks().find((t) => t.readyState === 'live');
      if (existingTrack) {
        existingTrack.enabled = true;
        if (localVideoRef.current && localStreamRef.current) {
          if (localVideoRef.current.srcObject !== localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
          localVideoRef.current.play().catch(() => {});
        }
        setIsVideoOff(false);
        setMediaError(null);
        replaceVideoTrack(existingTrack);
        socketRef.current?.emit('toggle-video', { isVideoOff: false });
        return;
      }

      // Remove any dead/ended video tracks
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => {
          localStreamRef.current!.removeTrack(t);
          try { t.stop(); } catch {}
        });
      }

      try {
        let videoStream: MediaStream;
        try {
          videoStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          });
        } catch {
          videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        const newTrack = videoStream.getVideoTracks()[0];
        if (!newTrack) throw new Error('No video track available');

        if (localStreamRef.current) {
          localStreamRef.current.addTrack(newTrack);
        } else {
          localStreamRef.current = new MediaStream([newTrack]);
        }

        setLocalStream(localStreamRef.current);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
          localVideoRef.current.play().catch(() => {});
        }

        setIsVideoOff(false);
        setMediaError(null);
        replaceVideoTrack(newTrack);
        socketRef.current?.emit('toggle-video', { isVideoOff: false });
      } catch (err: any) {
        console.warn('[Media] Camera request failed:', err);
        setIsVideoOff(true);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setMediaError('Camera permission blocked. Click the lock icon in the URL bar to allow camera access.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setMediaError('No plugged-in camera detected. Please plug in your webcam.');
        } else {
          setMediaError(`Camera access error: ${err.message || 'Device in use by another app'}`);
        }
      }
    } else {
      setIsVideoOff(true);
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => {
          t.enabled = false;
        });
      }
      socketRef.current?.emit('toggle-video', { isVideoOff: true });
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        const screenTrack = screenStream.getVideoTracks()[0];
        replaceVideoTrack(screenTrack);
        socketRef.current?.emit('toggle-screen-share', { isScreenSharing: true });

        screenTrack.onended = () => {
          setIsScreenSharing(false);
          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
          const camTrack = localStreamRef.current?.getVideoTracks()[0] || null;
          replaceVideoTrack(camTrack);
          socketRef.current?.emit('toggle-screen-share', { isScreenSharing: false });
        };
      } catch (err) {
        console.warn('Screen share cancelled', err);
      }
    } else {
      setIsScreenSharing(false);
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      const camTrack = localStreamRef.current?.getVideoTracks()[0] || null;
      replaceVideoTrack(camTrack);
      socketRef.current?.emit('toggle-screen-share', { isScreenSharing: false });
    }
  };

  // Chat message sending
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;

    socketRef.current.emit('send-message', {
      meetingId,
      text: newMessage.trim(),
    });
    setNewMessage('');
  };

  // AI Meeting Intelligence Trigger
  const handleGenerateSummary = async () => {
    setAiLoading(true);
    const res = await apiFetch(`/meetings/${meetingId}/ai-summary`, {
      method: 'POST',
      body: JSON.stringify({ transcript }),
    });

    if (res.success && res.data?.summary) {
      setAiSummary(res.data.summary);
    }
    setAiLoading(false);
  };

  // 1-Click Convert Action Items to Kanban Tasks
  const handleConvertActionItemsToTasks = async () => {
    if (!aiSummary?.actionItems) return;

    for (const item of aiSummary.actionItems) {
      await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: item.title,
          description: item.description,
          assigneeName: item.assigneeName || 'Assigned Member',
          status: 'todo',
          priority: 'high',
          dueDate: item.dueDate,
          sourceMeetingId: meetingId,
        }),
      });
    }

    setTasksCreated(true);
  };

  const copyMeetingId = () => {
    navigator.clipboard.writeText(meetingId);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div style={{
      height: 'calc(100vh - 70px)',
      display: 'flex',
      flexDirection: 'column',
      background: '#07090e',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: '52px',
        background: '#0d0e12',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            color: '#fb7185',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.68rem',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f43f5e' }} />
            Live Session
          </div>
          <h3 style={{ fontSize: '0.96rem', fontWeight: 600, color: '#f4f4f5' }}>{meetingTitle}</h3>
          <button
            onClick={copyMeetingId}
            title="Copy Meeting ID"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '5px',
              color: copiedLink ? '#10b981' : '#a1a1aa',
              fontSize: '0.72rem',
              fontFamily: 'monospace',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {copiedLink ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
            <span>{copiedLink ? 'Copied ID' : 'Copy ID'}</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            padding: '3px 10px',
            borderRadius: '12px',
            color: '#a1a1aa',
            fontSize: '0.75rem',
            fontWeight: 500,
          }}>
            <Users size={12} color="#10b981" />
            <span>{participants.length + 1} connected</span>
          </div>

          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'participants' ? null : 'participants')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '6px',
              border: `1px solid ${activeSidePanel === 'participants' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
              background: activeSidePanel === 'participants' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              color: activeSidePanel === 'participants' ? '#34d399' : '#a1a1aa',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
              transition: 'all 0.15s ease',
            }}
          >
            <Users size={14} />
            <span>People ({participants.length + 1})</span>
          </button>

          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'chat' ? null : 'chat')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '6px',
              border: `1px solid ${activeSidePanel === 'chat' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
              background: activeSidePanel === 'chat' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              color: activeSidePanel === 'chat' ? '#34d399' : '#a1a1aa',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
              transition: 'all 0.15s ease',
            }}
          >
            <MessageSquare size={14} />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'ai' ? null : 'ai')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '6px',
              border: `1px solid ${activeSidePanel === 'ai' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
              background: activeSidePanel === 'ai' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              color: activeSidePanel === 'ai' ? '#34d399' : '#a1a1aa',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={14} color="#10b981" />
            <span>AI Intelligence</span>
          </button>
        </div>
      </div>

      {/* Floating Permission Prompt (Google Meet style) */}
      {permissionPrompt && (
        <div style={{
          position: 'fixed',
          top: '65px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.98)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '12px',
          padding: '14px 20px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.7)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          maxWidth: '520px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {permissionPrompt.type === 'audio' ? <Mic size={20} color="#10b981" /> : <VideoIcon size={20} color="#10b981" />}
            <span style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 500 }}>{permissionPrompt.message}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => {
                if (permissionPrompt.type === 'audio') toggleAudio();
                else toggleVideo();
                setPermissionPrompt(null);
              }}
              className="btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            >
              {permissionPrompt.type === 'audio' ? 'Unmute' : 'Start Video'}
            </button>
            <button
              onClick={() => setPermissionPrompt(null)}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              Stay Off
            </button>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '85px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(24, 24, 27, 0.96)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          padding: '8px 18px',
          fontSize: '0.82rem',
          color: '#f4f4f5',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
          zIndex: 100,
        }}>
          {toastMessage}
        </div>
      )}

      {mediaError && (isVideoOff || isAudioMuted) && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.25)',
          padding: '8px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          color: '#fca5a5',
          fontSize: '0.82rem',
          zIndex: 15,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={15} style={{ flexShrink: 0, color: '#f87171' }} />
            <span>{mediaError}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={initMedia}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#ffffff',
                padding: '3px 9px',
                borderRadius: '5px',
                fontSize: '0.74rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RefreshCw size={11} />
              Retry
            </button>
            <button
              onClick={() => setMediaError(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#f87171',
                cursor: 'pointer',
                padding: '2px',
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          flex: 1,
          padding: '16px',
          display: 'grid',
          gridTemplateColumns: participants.length > 0 ? 'repeat(auto-fit, minmax(360px, 1fr))' : '1fr',
          gap: '16px',
          alignContent: 'center',
          overflowY: 'auto',
        }}>
          <div style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            background: '#0f172a',
            border: '2px solid rgba(99, 102, 241, 0.35)',
            aspectRatio: '16/9',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                localVideoRef.current?.play().catch(() => {});
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: isScreenSharing ? 'none' : 'scaleX(-1)',
                display: isVideoOff ? 'none' : 'block',
              }}
            />

            {isVideoOff && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  color: '#ffffff',
                }}>
                  {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Camera turned off</span>
              </div>
            )}

            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(8px)',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: '#f8fafc',
            }}>
              <span>{currentUser?.name || 'You'} (You)</span>
              {isAudioMuted && <span title="Microphone muted"><MicOff size={13} color="#f87171" /></span>}
              {isVideoOff && <span title="Camera turned off"><VideoOff size={13} color="#f87171" /></span>}
              {isScreenSharing && <ScreenShare size={13} color="#38bdf8" />}
            </div>
          </div>

          {participants.map((peer) => (
            <RemoteParticipantVideo
              key={peer.socketId}
              peer={peer}
              stream={remoteStreams[peer.socketId]}
              isHost={isHost}
              onHostControl={handleHostControl}
            />
          ))}
        </div>

        {activeSidePanel === 'chat' && (
          <div className="meeting-side-panel" style={{
            width: '350px',
            background: '#101116',
            borderLeft: '1px solid rgba(255, 255, 255, 0.07)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 25,
          }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255, 255, 255, 0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f4f4f5' }}>In-Meeting Chat</h4>
                <p style={{ fontSize: '0.72rem', color: '#71717a' }}>Encrypted channel</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  Active
                </span>
                <button
                  onClick={() => setActiveSidePanel(null)}
                  title="Close Panel"
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#71717a', fontSize: '0.82rem', marginTop: '40px' }}>
                  No messages yet. Send a greeting to participants!
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isMe = m.senderId === currentUser?.id;
                  return (
                    <div
                      key={idx}
                      style={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        background: isMe ? 'rgba(16, 185, 129, 0.15)' : '#181920',
                        border: isMe ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.07)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        color: isMe ? '#d1fae5' : '#f4f4f5',
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', color: isMe ? '#6ee7b7' : '#a1a1aa', marginBottom: '2px', fontWeight: 600 }}>
                        {m.senderName}
                      </div>
                      <div style={{ fontSize: '0.82rem', wordBreak: 'break-word', lineHeight: 1.4 }}>{m.text}</div>
                    </div>
                  );
                })
              )}
              {typingUser && (
                <div style={{ fontSize: '0.72rem', color: '#34d399', fontStyle: 'italic' }}>
                  {typingUser} is typing...
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} style={{ padding: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.07)', display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                style={{ flex: 1, fontSize: '0.82rem', padding: '8px 12px' }}
              />
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '8px 12px' }}
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        )}

        {activeSidePanel === 'ai' && (
          <div className="meeting-side-panel" style={{
            width: '420px',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            zIndex: 25,
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>AI Meeting Intelligence</h4>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Transcription, Summaries & Action Items</p>
                </div>
              </div>
              <button
                onClick={() => setActiveSidePanel(null)}
                title="Close Panel"
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                Live Transcript Feed:
              </label>
              <textarea
                rows={5}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                style={{ width: '100%', fontSize: '0.8rem', lineHeight: 1.4, resize: 'vertical' }}
              />
            </div>

            <button
              onClick={handleGenerateSummary}
              disabled={aiLoading}
              className="gradient-btn"
              style={{
                padding: '10px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '0.88rem',
                marginBottom: '20px',
              }}
            >
              <Sparkles size={16} />
              {aiLoading ? 'Analyzing Transcript with AI...' : 'Generate AI Summary & Actions'}
            </button>

            {aiSummary && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="glass-card" style={{ padding: '14px' }}>
                  <h5 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#818cf8', marginBottom: '6px' }}>
                    Executive Summary
                  </h5>
                  <p style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                    {aiSummary.executiveSummary}
                  </p>
                </div>

                <div className="glass-card" style={{ padding: '14px' }}>
                  <h5 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#34d399', marginBottom: '6px' }}>
                    Key Decisions ({aiSummary.decisions?.length || 0})
                  </h5>
                  <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {aiSummary.decisions?.map((dec: string, i: number) => (
                      <li key={i}>{dec}</li>
                    ))}
                  </ul>
                </div>

                <div className="glass-card" style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h5 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f59e0b' }}>
                      Action Items ({aiSummary.actionItems?.length || 0})
                    </h5>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {aiSummary.actionItems?.map((act: any, i: number) => (
                      <div key={i} style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px', borderRadius: '6px', fontSize: '0.78rem' }}>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{act.title}</div>
                        <div style={{ color: '#94a3b8', marginTop: '2px' }}>
                          Assignee: <span style={{ color: '#cbd5e1' }}>{act.assigneeName || 'Unassigned'}</span> | Due: <span style={{ color: '#cbd5e1' }}>{act.dueDate || 'ASAP'}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '14px' }}>
                    {tasksCreated ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.8rem' }}>
                        <CheckCircle size={16} /> Action items added to Kanban Board!
                        <button
                          onClick={onOpenKanban}
                          style={{
                            marginLeft: 'auto',
                            background: 'transparent',
                            border: 'none',
                            color: '#818cf8',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          View Board
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleConvertActionItemsToTasks}
                        className="btn-primary"
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          fontSize: '0.82rem',
                        }}
                      >
                        <span>Push to Team Kanban Tasks</span>
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSidePanel === 'participants' && (
          <div className="meeting-side-panel" style={{
            width: '360px',
            background: '#101116',
            borderLeft: '1px solid rgba(255, 255, 255, 0.07)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 25,
          }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255, 255, 255, 0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f4f4f5' }}>People ({participants.length + 1})</h4>
                <p style={{ fontSize: '0.72rem', color: '#71717a' }}>{isHost ? 'Host controls active' : 'Active attendees'}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isHost && participants.length > 0 && (
                  <button
                    onClick={handleMuteAll}
                    title="Mute everyone in room"
                    style={{
                      background: 'rgba(244, 63, 94, 0.12)',
                      border: '1px solid rgba(244, 63, 94, 0.25)',
                      color: '#fb7185',
                      padding: '3px 8px',
                      borderRadius: '5px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <MicOff size={11} />
                    <span>Mute All</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveSidePanel(null)}
                  title="Close Panel"
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Current user row */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                padding: '10px 12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: '#fff',
                  }}>
                    {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>
                      {currentUser?.name || 'You'} (You)
                    </div>
                    {isHost && <span style={{ color: '#10b981', fontSize: '0.72rem', fontWeight: 500 }}>Meeting Host</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {isAudioMuted ? <span title="Microphone muted"><MicOff size={14} color="#f87171" /></span> : <Mic size={14} color="#10b981" />}
                  {isVideoOff ? <span title="Camera off"><VideoOff size={14} color="#f87171" /></span> : <VideoIcon size={14} color="#10b981" />}
                </div>
              </div>

              {/* Remote participants list */}
              {participants.map((p) => (
                <div
                  key={p.socketId}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: '#fff',
                    }}>
                      {p.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {p.isAudioMuted ? 'Muted' : 'Speaking'} • {p.isVideoOff ? 'Camera off' : 'Camera on'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isHost ? (
                      <>
                        {p.isAudioMuted ? (
                          <button
                            onClick={() => handleHostControl(p.socketId, 'request-unmute')}
                            title="Ask to unmute"
                            style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', padding: '3px' }}
                          >
                            <Mic size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleHostControl(p.socketId, 'mute')}
                            title="Mute participant"
                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '3px' }}
                          >
                            <MicOff size={14} />
                          </button>
                        )}

                        {p.isVideoOff ? (
                          <button
                            onClick={() => handleHostControl(p.socketId, 'request-video')}
                            title="Ask to start camera"
                            style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', padding: '3px' }}
                          >
                            <VideoIcon size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleHostControl(p.socketId, 'stop-video')}
                            title="Turn off camera"
                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '3px' }}
                          >
                            <VideoOff size={14} />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (window.confirm(`Remove ${p.name} from the meeting?`)) {
                              handleHostControl(p.socketId, 'remove-user');
                            }
                          }}
                          title="Remove from meeting"
                          style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '3px' }}
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        {p.isAudioMuted ? <span title="Muted"><MicOff size={14} color="#f87171" /></span> : <Mic size={14} color="#10b981" />}
                        {p.isVideoOff ? <span title="Camera off"><VideoOff size={14} color="#f87171" /></span> : <VideoIcon size={14} color="#10b981" />}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="meeting-controls-dock" style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 16px',
        background: 'rgba(18, 20, 26, 0.94)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        zIndex: 30,
      }}>
        <button
          onClick={toggleAudio}
          title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            border: isAudioMuted ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
            background: isAudioMuted ? 'rgba(244, 63, 94, 0.15)' : '#1a1c24',
            color: isAudioMuted ? '#fb7185' : '#f4f4f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {isAudioMuted ? <MicOff size={18} /> : <Mic size={18} color="#10b981" />}
        </button>

        <button
          onClick={toggleVideo}
          title={isVideoOff ? 'Start Video' : 'Stop Video'}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            border: isVideoOff ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
            background: isVideoOff ? 'rgba(244, 63, 94, 0.15)' : '#1a1c24',
            color: isVideoOff ? '#fb7185' : '#f4f4f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {isVideoOff ? <VideoOff size={18} /> : <VideoIcon size={18} color="#10b981" />}
        </button>

        <button
          onClick={toggleScreenShare}
          title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            border: isScreenSharing ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
            background: isScreenSharing ? 'rgba(16, 185, 129, 0.15)' : '#1a1c24',
            color: isScreenSharing ? '#34d399' : '#f4f4f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <ScreenShare size={18} />
        </button>

        {isHost && (
          <button
            onClick={handleMuteAll}
            title="Mute Everyone in Room"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              background: 'rgba(244, 63, 94, 0.15)',
              color: '#fb7185',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <MicOff size={18} />
          </button>
        )}

        <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.1)', margin: '0 4px' }} />

        {isHost && (
          <button
            onClick={handleEndMeetingForAll}
            title="End Meeting for All Participants"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(244, 63, 94, 0.5)',
              background: '#be123c',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.84rem',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#9f1239')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#be123c')}
          >
            <PhoneOff size={16} />
            <span>End for All</span>
          </button>
        )}

        <button
          onClick={onLeaveMeeting}
          title="Leave Meeting"
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(255, 255, 255, 0.08)',
            color: '#f4f4f5',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.84rem',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.14)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
        >
          <PhoneOff size={16} color="#fb7185" />
          <span>Leave Room</span>
        </button>
      </div>
    </div>
  );
};

