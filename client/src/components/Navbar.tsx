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
      padding: '0 28px',
      height: '62px',
      background: 'rgba(12, 13, 16, 0.95)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Brand Logo & Workspace Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }} onClick={() => onSelectTab('meetings')}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: '#10b981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
        }}>
          <Video size={17} color="#042f1a" strokeWidth={2.5} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 600, letterSpacing: '-0.02em', color: '#f4f4f5' }}>
            Intell<span style={{ color: '#10b981' }}>Meet</span>
          </span>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            background: 'rgba(16, 185, 129, 0.1)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            padding: '2px 7px',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span className="live-indicator" style={{ width: '5px', height: '5px' }} />
            Workspace
          </span>
        </div>
      </div>

      {/* Center Navigation Tabs - Vercel Segmented Style */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        background: '#15171d',
        padding: '3px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <button
          onClick={() => onSelectTab('meetings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.84rem',
            fontWeight: currentTab === 'meetings' ? 600 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: currentTab === 'meetings' ? '#22252e' : 'transparent',
            color: currentTab === 'meetings' ? '#ffffff' : '#a1a1aa',
            boxShadow: currentTab === 'meetings' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : 'none',
          }}
        >
          <Video size={14} color={currentTab === 'meetings' ? '#10b981' : '#71717a'} />
          <span>Meetings</span>
        </button>

        <button
          onClick={() => onSelectTab('kanban')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.84rem',
            fontWeight: currentTab === 'kanban' ? 600 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: currentTab === 'kanban' ? '#22252e' : 'transparent',
            color: currentTab === 'kanban' ? '#ffffff' : '#a1a1aa',
            boxShadow: currentTab === 'kanban' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : 'none',
          }}
        >
          <Kanban size={14} color={currentTab === 'kanban' ? '#10b981' : '#71717a'} />
          <span>Tasks & Actions</span>
        </button>

        <button
          onClick={() => onSelectTab('analytics')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.84rem',
            fontWeight: currentTab === 'analytics' ? 600 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: currentTab === 'analytics' ? '#22252e' : 'transparent',
            color: currentTab === 'analytics' ? '#ffffff' : '#a1a1aa',
            boxShadow: currentTab === 'analytics' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : 'none',
          }}
        >
          <BarChart3 size={14} color={currentTab === 'analytics' ? '#10b981' : '#71717a'} />
          <span>Analytics</span>
        </button>
      </nav>

      {/* User Profile & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          padding: '4px 10px 4px 6px',
          background: '#16181e',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: '#22252e',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981',
            fontWeight: 600,
            fontSize: '0.78rem'
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={14} />}
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#f4f4f5' }}>{user?.name || 'Guest User'}</div>
            <div style={{ fontSize: '0.68rem', color: '#71717a', textTransform: 'capitalize' }}>{user?.role || 'Member'}</div>
          </div>
        </div>

        <button
          onClick={onLogout}
          title="Sign Out"
          aria-label="Sign Out"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: '#16181e',
            color: '#a1a1aa',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#f43f5e';
            e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#a1a1aa';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
};

