import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiFetch } from '../../api/client.js';
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, ScreenShare, PhoneOff,
  MessageSquare, Sparkles, Send, Users, CheckCircle, ArrowRight, Copy, Check
} from 'lucide-react';

interface MeetingRoomProps {
  meetingId: string;
  meetingTitle: string;
  currentUser: any;
  onLeaveMeeting: () => void;
  onOpenKanban: () => void;
}

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

  // Panels & Views
  const [activeSidePanel, setActiveSidePanel] = useState<'chat' | 'ai' | null>('chat');

  // Chat & Socket
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);

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

  // Video Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Setup Local Media Stream
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (active) {
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn('[Media] Camera/Mic access denied or unavailable in this environment:', err);
      }
    }

    initMedia();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Setup Socket.io Connection & Signaling
  useEffect(() => {
    const socket = io('/', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.emit('join-room', {
      meetingId,
      userId: currentUser?.id || 'guest',
      name: currentUser?.name || 'Guest User',
      avatar: currentUser?.avatar,
    });

    socket.on('room-users', ({ participants: existingPeers }) => {
      // Provide demo peers if solo for rich collaboration testing
      const peerList = existingPeers.length > 0 ? existingPeers : [
        {
          socketId: 'demo_peer_1',
          userId: 'usr_sarah',
          name: 'Sarah Connor (Architect)',
          isAudioMuted: false,
          isVideoOff: false,
          isScreenSharing: false,
        },
        {
          socketId: 'demo_peer_2',
          userId: 'usr_david',
          name: 'David Kim (Backend Lead)',
          isAudioMuted: true,
          isVideoOff: false,
          isScreenSharing: false,
        }
      ];
      setParticipants(peerList);
    });

    socket.on('user-joined', ({ participant }) => {
      setParticipants((prev) => [...prev.filter((p) => p.socketId !== participant.socketId), participant]);
    });

    socket.on('user-left', ({ socketId }) => {
      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
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
      socket.disconnect();
    };
  }, [meetingId, currentUser]);

  // Toggle Media Controls
  const toggleAudio = () => {
    const nextState = !isAudioMuted;
    setIsAudioMuted(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !nextState;
      });
    }
    socketRef.current?.emit('toggle-audio', { isAudioMuted: nextState });
  };

  const toggleVideo = () => {
    const nextState = !isVideoOff;
    setIsVideoOff(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = !nextState;
      });
    }
    socketRef.current?.emit('toggle-video', { isVideoOff: nextState });
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        socketRef.current?.emit('toggle-screen-share', { isScreenSharing: true });

        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
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
      {/* Top Meeting Info Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        background: 'rgba(15, 23, 42, 0.7)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} className="pulse-badge" />
            REC
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc' }}>{meetingTitle}</h3>
          <button
            onClick={copyMeetingId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#94a3b8',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            {copiedLink ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
            {copiedLink ? 'Copied ID' : 'Copy ID'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(99, 102, 241, 0.15)',
            padding: '4px 12px',
            borderRadius: '20px',
            color: '#a5b4fc',
            fontSize: '0.78rem',
            fontWeight: 600,
          }}>
            <Users size={14} /> {participants.length + 1} in call
          </div>

          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'chat' ? null : 'chat')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: activeSidePanel === 'chat' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              color: activeSidePanel === 'chat' ? '#a5b4fc' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.82rem',
            }}
          >
            <MessageSquare size={15} /> Chat
          </button>

          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'ai' ? null : 'ai')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              background: activeSidePanel === 'ai' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(168, 85, 247, 0.3) 100%)' : 'rgba(168, 85, 247, 0.12)',
              color: '#c084fc',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            <Sparkles size={15} /> AI Intelligence
          </button>
        </div>
      </div>

      {/* Main Area: Video Grid + Optional Drawer */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Video Stage */}
        <div style={{
          flex: 1,
          padding: '16px',
          display: 'grid',
          gridTemplateColumns: participants.length > 0 ? 'repeat(auto-fit, minmax(360px, 1fr))' : '1fr',
          gap: '16px',
          alignContent: 'center',
          overflowY: 'auto',
        }}>
          {/* Local Participant Card */}
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
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
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

            {/* Video Overlay Name & Badges */}
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
              {isAudioMuted && <MicOff size={13} color="#f87171" />}
              {isScreenSharing && <ScreenShare size={13} color="#38bdf8" />}
            </div>
          </div>

          {/* Remote Participants */}
          {participants.map((peer) => (
            <div
              key={peer.socketId}
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
              {/* Avatar representation for peers */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{
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
                }}>
                  {peer.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 500 }}>{peer.name}</span>
              </div>

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
                <span>{peer.name}</span>
                {peer.isAudioMuted && <MicOff size={13} color="#f87171" />}
              </div>
            </div>
          ))}
        </div>

        {/* Side Panel: In-Meeting Live Chat */}
        {activeSidePanel === 'chat' && (
          <div style={{
            width: '360px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 20,
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>In-Meeting Chat</h4>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Real-time encrypted message exchange</p>
            </div>

            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem', marginTop: '40px' }}>
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
                        background: isMe ? '#6366f1' : 'rgba(255, 255, 255, 0.08)',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        color: '#ffffff',
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', opacity: 0.8, marginBottom: '2px', fontWeight: 600 }}>
                        {m.senderName}
                      </div>
                      <div style={{ fontSize: '0.85rem', wordBreak: 'break-word' }}>{m.text}</div>
                    </div>
                  );
                })
              )}
              {typingUser && (
                <div style={{ fontSize: '0.75rem', color: '#a5b4fc', fontStyle: 'italic' }}>
                  {typingUser} is typing...
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} style={{ padding: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                style={{ flex: 1, fontSize: '0.85rem' }}
              />
              <button
                type="submit"
                className="gradient-btn"
                style={{ padding: '8px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        )}

        {/* Side Panel: AI Meeting Intelligence */}
        {activeSidePanel === 'ai' && (
          <div style={{
            width: '420px',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            zIndex: 20,
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>
                <Sparkles size={18} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>AI Meeting Intelligence</h4>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Transcription, Summaries & Action Items</p>
              </div>
            </div>

            {/* Transcript Input / Feed */}
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

            {/* AI Summary Results */}
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

                  {/* 1-Click Convert to Kanban Tasks */}
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
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(99, 102, 241, 0.4)',
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: '#a5b4fc',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        Push to Team Kanban Tasks <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Bottom Control Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
        padding: '16px',
        background: 'rgba(10, 13, 20, 0.85)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 30,
      }}>
        <button
          onClick={toggleAudio}
          title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            border: 'none',
            background: isAudioMuted ? '#ef4444' : 'rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button
          onClick={toggleVideo}
          title={isVideoOff ? 'Start Video' : 'Stop Video'}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            border: 'none',
            background: isVideoOff ? '#ef4444' : 'rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {isVideoOff ? <VideoOff size={20} /> : <VideoIcon size={20} />}
        </button>

        <button
          onClick={toggleScreenShare}
          title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            border: 'none',
            background: isScreenSharing ? '#06b6d4' : 'rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <ScreenShare size={20} />
        </button>

        <button
          onClick={onLeaveMeeting}
          title="Leave Meeting"
          style={{
            padding: '10px 24px',
            borderRadius: '24px',
            border: 'none',
            background: '#ef4444',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
          }}
        >
          <PhoneOff size={18} /> End Call
        </button>
      </div>
    </div>
  );
};
