import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import { Video, CheckSquare, Sparkles, TrendingUp, Users, Activity, ShieldCheck } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await apiFetch('/analytics');
      if (res.success && res.data) {
        setData(res.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Loading analytics...</div>;
  }

  const meetings = data?.meetings || { total: 0, active: 0, completed: 0, totalParticipants: 0 };
  const tasks = data?.tasks || { total: 0, done: 0, inProgress: 0, todo: 0, completionRate: 0 };

  return (
    <div className="container-responsive" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: 'clamp(1.25rem, 3.5vw, 1.6rem)', fontWeight: 700 }}>Workspace Intelligence & Analytics</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
          Real-time metrics on meeting engagement, AI processing, and project execution
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Total Meetings</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <Video size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc' }}>{meetings.total}</div>
          <div style={{ fontSize: '0.78rem', color: '#34d399', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Activity size={13} /> {meetings.active} active currently
          </div>
        </div>

        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Task Completion Rate</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <CheckSquare size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc' }}>{tasks.completionRate}%</div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '6px' }}>
            {tasks.done} of {tasks.total} deliverables completed
          </div>
        </div>

        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>AI Summaries Processed</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc' }}>
            {data?.aiSummariesGenerated || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#a5b4fc', marginTop: '6px' }}>
            Automated action item extraction
          </div>
        </div>

        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Total Participant Sessions</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc' }}>{meetings.totalParticipants}</div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '6px' }}>
            Across WebRTC mesh rooms
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '18px' }}>Task Execution Pipeline</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                <span style={{ color: '#cbd5e1' }}>Done ({tasks.done})</span>
                <span style={{ color: '#34d399', fontWeight: 600 }}>{tasks.completionRate}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${tasks.completionRate}%`, height: '100%', background: '#10b981', borderRadius: '4px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                <span style={{ color: '#cbd5e1' }}>In Progress ({tasks.inProgress})</span>
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                  {tasks.total > 0 ? Math.round((tasks.inProgress / tasks.total) * 100) : 0}%
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${tasks.total > 0 ? Math.round((tasks.inProgress / tasks.total) * 100) : 0}%`,
                  height: '100%',
                  background: '#f59e0b',
                  borderRadius: '4px',
                }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                <span style={{ color: '#cbd5e1' }}>To Do ({tasks.todo})</span>
                <span style={{ color: '#818cf8', fontWeight: 600 }}>
                  {tasks.total > 0 ? Math.round((tasks.todo / tasks.total) * 100) : 0}%
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${tasks.total > 0 ? Math.round((tasks.todo / tasks.total) * 100) : 0}%`,
                  height: '100%',
                  background: '#6366f1',
                  borderRadius: '4px',
                }} />
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '18px' }}>Enterprise Platform Health</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>WebRTC Media Mesh</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                ACTIVE
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Socket.io Signaling Relay</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                CONNECTED
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>AI NLP Summarizer Engine</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a5b4fc', background: 'rgba(99, 102, 241, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                READY
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>JWT & Role Access Control</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                ENFORCED
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
