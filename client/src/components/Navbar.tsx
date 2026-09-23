import React from 'react';
import { Video, Kanban, BarChart3, LogOut, User as UserIcon, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentTab: 'meetings' | 'kanban' | 'analytics';
  onSelectTab: (tab: 'meetings' | 'kanban' | 'analytics') => void;
  user: any;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, user, onLogout }) => {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 28px',
      background: 'rgba(10, 13, 20, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => onSelectTab('meetings')}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(99, 102, 241, 0.35)',
        }}>
          <Video size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc' }}>
              Intell<span style={{ color: '#818cf8' }}>Meet</span>
            </span>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              background: 'rgba(99, 102, 241, 0.2)',
              color: '#a5b4fc',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              padding: '2px 6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              <Sparkles size={10} /> AI
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Enterprise Collaboration Platform</p>
        </div>
      </div>

      {/* Center Navigation Tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => onSelectTab('meetings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: currentTab === 'meetings' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: currentTab === 'meetings' ? '#818cf8' : '#94a3b8',
            borderBottom: currentTab === 'meetings' ? '2px solid #6366f1' : '2px solid transparent',
          }}
        >
          <Video size={16} /> Meetings
        </button>

        <button
          onClick={() => onSelectTab('kanban')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: currentTab === 'kanban' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: currentTab === 'kanban' ? '#818cf8' : '#94a3b8',
            borderBottom: currentTab === 'kanban' ? '2px solid #6366f1' : '2px solid transparent',
          }}
        >
          <Kanban size={16} /> Tasks & Action Items
        </button>

        <button
          onClick={() => onSelectTab('analytics')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: currentTab === 'analytics' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: currentTab === 'analytics' ? '#818cf8' : '#94a3b8',
            borderBottom: currentTab === 'analytics' ? '2px solid #6366f1' : '2px solid transparent',
          }}
        >
          <BarChart3 size={16} /> Analytics
        </button>
      </nav>

      {/* User Profile & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: '#1e293b',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a5b4fc',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={16} />}
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>{user?.name || 'Guest User'}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{user?.role || 'Member'}</div>
          </div>
        </div>

        <button
          onClick={onLogout}
          title="Sign Out"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.03)',
            color: '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};
