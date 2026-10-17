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
    <header className="navbar navbar-expand sticky-top px-2 px-sm-3 px-md-4" style={{
      height: '62px',
      background: 'rgba(12, 13, 16, 0.95)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
      zIndex: 50,
    }}>
      <div className="container-fluid p-0 d-flex align-items-center justify-content-between">
        {/* Brand */}
        <div className="d-flex align-items-center gap-2 gap-sm-3 cursor-pointer" onClick={() => onSelectTab('meetings')} role="button">
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
            flexShrink: 0,
          }}>
            <Video size={17} color="#042f1a" strokeWidth={2.5} />
          </div>
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: '1.05rem', fontWeight: 600, letterSpacing: '-0.02em', color: '#f4f4f5' }}>
              Intell<span style={{ color: '#10b981' }}>Meet</span>
            </span>
            <span className="d-none d-sm-inline-flex align-items-center gap-1" style={{
              fontSize: '0.65rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '2px 7px',
              borderRadius: '12px',
            }}>
              <span className="live-indicator" style={{ width: '5px', height: '5px' }} />
              Workspace
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="d-flex align-items-center p-1 rounded-3" style={{
          background: '#15171d',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          gap: '2px',
        }}>
          <button
            onClick={() => onSelectTab('meetings')}
            title="Meetings"
            className="btn btn-sm d-flex align-items-center gap-1 gap-md-2"
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.84rem',
              fontWeight: currentTab === 'meetings' ? 600 : 500,
              background: currentTab === 'meetings' ? '#22252e' : 'transparent',
              color: currentTab === 'meetings' ? '#ffffff' : '#a1a1aa',
              boxShadow: currentTab === 'meetings' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : 'none',
            }}
          >
            <Video size={15} color={currentTab === 'meetings' ? '#10b981' : '#71717a'} />
            <span className="d-none d-md-inline">Meetings</span>
          </button>

          <button
            onClick={() => onSelectTab('kanban')}
            title="Tasks & Actions"
            className="btn btn-sm d-flex align-items-center gap-1 gap-md-2"
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.84rem',
              fontWeight: currentTab === 'kanban' ? 600 : 500,
              background: currentTab === 'kanban' ? '#22252e' : 'transparent',
              color: currentTab === 'kanban' ? '#ffffff' : '#a1a1aa',
              boxShadow: currentTab === 'kanban' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : 'none',
            }}
          >
            <Kanban size={15} color={currentTab === 'kanban' ? '#10b981' : '#71717a'} />
            <span className="d-none d-md-inline">Tasks</span>
          </button>

          <button
            onClick={() => onSelectTab('analytics')}
            title="Analytics"
            className="btn btn-sm d-flex align-items-center gap-1 gap-md-2"
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.84rem',
              fontWeight: currentTab === 'analytics' ? 600 : 500,
              background: currentTab === 'analytics' ? '#22252e' : 'transparent',
              color: currentTab === 'analytics' ? '#ffffff' : '#a1a1aa',
              boxShadow: currentTab === 'analytics' ? '0 1px 3px rgba(0, 0, 0, 0.3)' : 'none',
            }}
          >
            <BarChart3 size={15} color={currentTab === 'analytics' ? '#10b981' : '#71717a'} />
            <span className="d-none d-md-inline">Analytics</span>
          </button>
        </nav>

        {/* User Profile & Sign Out */}
        <div className="d-flex align-items-center gap-2">
          <div className="d-flex align-items-center gap-2 p-1 pe-2 rounded-2" style={{
            background: '#16181e',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            maxWidth: '160px',
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
              fontSize: '0.78rem',
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || 'User'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : user?.name ? (
                user.name.charAt(0).toUpperCase()
              ) : (
                <UserIcon size={14} />
              )}
            </div>
            <div className="d-none d-sm-block text-truncate" style={{ lineHeight: 1.2, minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#f4f4f5', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.name || 'Guest'}
              </div>
              <div className="user-role-badge" style={{ fontSize: '0.68rem', color: '#71717a', textTransform: 'capitalize' }}>
                {user?.role || 'Member'}
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Sign Out"
            aria-label="Sign Out"
            className="btn btn-sm d-flex align-items-center justify-content-center p-0"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: '#16181e',
              color: '#a1a1aa',
              flexShrink: 0,
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
      </div>
    </header>
  );
};

