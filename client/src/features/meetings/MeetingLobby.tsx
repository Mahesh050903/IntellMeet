import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import { Video, Plus, Key, Calendar, Users, Clock, ArrowRight, Play, CheckCircle2, Copy, Check, Radio } from 'lucide-react';

interface MeetingLobbyProps {
  onJoinMeeting: (meetingId: string, meetingTitle: string) => void;
  currentUser: any;
}

export const MeetingLobby: React.FC<MeetingLobbyProps> = ({ onJoinMeeting, currentUser }) => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchMeetings = async () => {
    setLoading(true);
    const res = await apiFetch('/meetings');
    if (res.success && res.data?.meetings) {
      setMeetings(res.data.meetings);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const res = await apiFetch('/meetings', {
      method: 'POST',
      body: JSON.stringify({
        title: newTitle,
        passCode: newPasscode || undefined,
      }),
    });

    if (res.success && res.data?.meeting) {
      setShowCreateModal(false);
      setNewTitle('');
      setNewPasscode('');
      const id = res.data.meeting._id || res.data.meeting.id;
      onJoinMeeting(id, res.data.meeting.title);
    }
  };

  const handleInstantMeeting = async () => {
    const res = await apiFetch('/meetings', {
      method: 'POST',
      body: JSON.stringify({
        title: `${currentUser?.name || 'Quick'}'s Instant Meeting`,
      }),
    });

    if (res.success && res.data?.meeting) {
      const id = res.data.meeting._id || res.data.meeting.id;
      onJoinMeeting(id, res.data.meeting.title);
    }
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    onJoinMeeting(joinCode.trim(), `Meeting #${joinCode.trim()}`);
  };

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '20px',
        marginBottom: '28px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f4f4f5' }}>
              Collaboration Hub
            </span>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span className="live-indicator" style={{ width: '5px', height: '5px' }} />
              WebRTC Active
            </span>
          </div>
          <p style={{ color: '#71717a', fontSize: '0.85rem' }}>
            Welcome back, <span style={{ color: '#d4d4d8', fontWeight: 500 }}>{currentUser?.name || 'User'}</span>. Launch instant rooms or browse team sessions.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-secondary"
          style={{ fontSize: '0.84rem' }}
        >
          <Plus size={15} color="#10b981" />
          <span>New Scheduled Room</span>
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '18px',
        marginBottom: '36px',
      }}>
        <div style={{
          background: '#12141a',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '10px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}>
                <Video size={18} strokeWidth={2.5} />
              </div>
              <span style={{
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#a1a1aa',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}>
                Instant Peer-Mesh
              </span>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
              Start Instant Meeting
            </h3>
            <p style={{ color: '#82828e', fontSize: '0.85rem', lineHeight: 1.5 }}>
              One-click video room with real-time audio, screen sharing, live chat, and AI transcription.
            </p>
          </div>

          <div style={{ marginTop: '22px' }}>
            <button
              onClick={handleInstantMeeting}
              className="btn-primary"
              style={{ width: '100%', padding: '11px 16px' }}
            >
              <Play size={15} fill="currentColor" />
              <span>Launch Room Now</span>
            </button>
          </div>
        </div>

        <div style={{
          background: '#12141a',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e4e4e7',
              }}>
                <Key size={18} strokeWidth={2.2} />
              </div>
              <span style={{
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#a1a1aa',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}>
                Direct Link
              </span>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
              Join with Room ID
            </h3>
            <p style={{ color: '#82828e', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Enter an existing meeting ID or host invitation code to connect directly.
            </p>
          </div>

          <form onSubmit={handleJoinByCode} style={{ display: 'flex', gap: '8px', marginTop: '22px' }}>
            <input
              type="text"
              placeholder="e.g. meet_b63892..."
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              style={{
                flex: 1,
                fontSize: '0.85rem',
                padding: '9px 12px',
                fontFamily: 'monospace',
              }}
            />
            <button
              type="submit"
              className="btn-secondary"
              style={{ padding: '9px 16px' }}
            >
              <span>Join</span>
              <ArrowRight size={15} />
            </button>
          </form>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f4f4f5' }}>Active & Recent Sessions</h3>
            <p style={{ color: '#71717a', fontSize: '0.82rem' }}>Currently running or scheduled meeting channels</p>
          </div>
          <button
            onClick={fetchMeetings}
            className="btn-ghost"
            style={{ fontSize: '0.8rem' }}
          >
            Refresh List
          </button>
        </div>

        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 20px',
            color: '#71717a',
            fontSize: '0.88rem',
            background: '#12141a',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}>
            Fetching live sessions...
          </div>
        ) : meetings.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 20px',
            background: '#12141a',
            borderRadius: '10px',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
              color: '#52525b',
            }}>
              <Video size={20} />
            </div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#d4d4d8', marginBottom: '4px' }}>
              No active sessions right now
            </h4>
            <p style={{ color: '#71717a', fontSize: '0.82rem', marginBottom: '18px' }}>
              Launch an instant meeting or schedule one to collaborate with teammates.
            </p>
            <button onClick={handleInstantMeeting} className="btn-primary" style={{ fontSize: '0.82rem', padding: '8px 16px' }}>
              <Play size={13} fill="currentColor" />
              <span>Launch First Meeting</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {meetings.map((m) => {
              const meetingId = m._id || m.id;
              const isActive = m.status === 'active';
              return (
                <div
                  key={meetingId}
                  style={{
                    background: '#12141a',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '10px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'border-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)')}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(113, 113, 122, 0.12)',
                        color: isActive ? '#34d399' : '#a1a1aa',
                        border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(113, 113, 122, 0.2)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        {isActive && <span className="live-indicator" style={{ width: '5px', height: '5px' }} />}
                        {m.status}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleCopyId(e, meetingId)}
                        title="Copy Room ID"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: copiedId === meetingId ? '#10b981' : '#71717a',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.72rem',
                          fontFamily: 'monospace',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          transition: 'color 0.15s ease',
                        }}
                      >
                        {copiedId === meetingId ? <Check size={12} /> : <Copy size={12} />}
                        <span>{meetingId.substring(0, 10)}...</span>
                      </button>
                    </div>

                    <h4 style={{ fontSize: '1.02rem', fontWeight: 600, marginBottom: '10px', color: '#f4f4f5' }}>
                      {m.title}
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#82828e', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={13} color="#71717a" />
                        <span>Host: <strong style={{ color: '#d4d4d8', fontWeight: 500 }}>{m.hostName || 'Team Lead'}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={13} color="#71717a" />
                        <span>Started: {new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => onJoinMeeting(meetingId, m.title)}
                      className="btn-primary"
                      style={{ flex: 1, padding: '9px 12px' }}
                    >
                      <span>Join Session</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 100,
        }}>
          <div style={{
            maxWidth: '420px',
            width: '100%',
            background: '#12141a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f4f4f5', marginBottom: '6px' }}>
              Create Scheduled Room
            </h3>
            <p style={{ color: '#71717a', fontSize: '0.82rem', marginBottom: '18px' }}>
              Define meeting details and optional security passcodes for enterprise guests.
            </p>

            <form onSubmit={handleCreateMeeting} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '6px', color: '#cbd5e1' }}>
                  Meeting Topic / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Engineering Architecture Sync"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '6px', color: '#cbd5e1' }}>
                  Passcode (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1234 (leave blank for open room)"
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  Create & Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
