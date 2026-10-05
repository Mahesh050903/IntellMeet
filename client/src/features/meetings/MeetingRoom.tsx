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
    });

    socket.on('room-users', ({ participants: existingPeers }) => {
      // Only show real participants who actually join the meeting
      setParticipants(existingPeers || []);
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
            width: '350px',
            background: '#101116',
            borderLeft: '1px solid rgba(255, 255, 255, 0.07)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 20,
          }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255, 255, 255, 0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f4f4f5' }}>In-Meeting Chat</h4>
                <p style={{ fontSize: '0.72rem', color: '#71717a' }}>Encrypted channel</p>
              </div>
              <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                Active
              </span>
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
      </div>

      {/* Floating Bottom Control Bar - Supabase/Vercel Dock */}
      <div style={{
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

        <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.1)', margin: '0 4px' }} />

        <button
          onClick={onLeaveMeeting}
          title="Leave Meeting"
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            background: '#e11d48',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.84rem',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#be123c')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#e11d48')}
        >
          <PhoneOff size={16} />
          <span>Leave Room</span>
        </button>
      </div>
    </div>
  );
};

