import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import { Video, Plus, Key, Calendar, Users, Clock, ArrowRight, Play, CheckCircle2 } from 'lucide-react';

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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '36px 20px' }}>
      {/* Hero Welcome & Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        marginBottom: '40px',
      }}>
        {/* Instant Meeting Card */}
        <div className="glass-panel" style={{
          padding: '28px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              padding: '10px',
              borderRadius: '12px',
              background: '#6366f1',
              color: '#ffffff',
              marginBottom: '16px',
            }}>
              <Video size={24} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>Start Instant Meeting</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.5 }}>
              Launch an enterprise WebRTC room with real-time audio, video, chat and automated AI transcription.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              onClick={handleInstantMeeting}
              className="gradient-btn"
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Play size={16} fill="white" /> Start Now
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '12px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#f8fafc',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={16} /> Schedule
            </button>
          </div>
        </div>

        {/* Join by Code Card */}
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              padding: '10px',
              borderRadius: '12px',
              background: 'rgba(6, 182, 212, 0.15)',
              color: '#06b6d4',
              marginBottom: '16px',
            }}>
              <Key size={24} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>Join with ID or Link</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.5 }}>
              Enter a meeting room code or ID provided by the meeting host to join the live session.
            </p>
          </div>
          <form onSubmit={handleJoinByCode} style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <input
              type="text"
              placeholder="e.g. meet_xyz123"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="gradient-btn"
              style={{ padding: '12px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              Join <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Available Meetings List */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Active & Recent Meetings</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Select an ongoing session to enter or review notes</p>
          </div>
          <button
            onClick={fetchMeetings}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '0.82rem',
            }}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading meetings...</div>
        ) : meetings.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '48px 20px' }}>
            <Video size={40} color="#475569" style={{ margin: '0 auto 14px auto' }} />
            <h4 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>No active meetings right now</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>Start an instant meeting above to test real-time video & chat</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
            {meetings.map((m) => {
              const meetingId = m._id || m.id;
              const isActive = m.status === 'active';
              return (
                <div key={meetingId} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                        color: isActive ? '#34d399' : '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        {isActive && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />}
                        {m.status}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        ID: {meetingId.substring(0, 12)}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px', color: '#f8fafc' }}>
                      {m.title}
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#94a3b8', fontSize: '0.8rem', marginTop: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} color="#6366f1" /> Hosted by: {m.hostName || 'Team Lead'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} color="#06b6d4" /> Created: {new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onJoinMeeting(meetingId, m.title)}
                    className="gradient-btn"
                    style={{
                      marginTop: '20px',
                      padding: '10px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '0.88rem',
                    }}
                  >
                    Enter Room <ArrowRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule / Custom Meeting Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 100,
        }}>
          <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Create Meeting</h3>
            <form onSubmit={handleCreateMeeting} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '6px', color: '#94a3b8' }}>
                  Meeting Topic / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Strategy Review"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '6px', color: '#94a3b8' }}>
                  Passcode (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1234"
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gradient-btn"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px' }}
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
