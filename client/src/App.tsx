import React, { useState, useEffect } from 'react';
import { getStoredToken, getStoredUser, removeStoredToken, removeStoredUser, apiFetch } from './api/client.js';
import { Navbar } from './components/Navbar.js';
import { AuthModal } from './features/auth/AuthModal.js';
import { MeetingLobby } from './features/meetings/MeetingLobby.js';
import { MeetingRoom } from './features/meetings/MeetingRoom.js';
import { KanbanBoard } from './features/tasks/KanbanBoard.js';
import { AnalyticsView } from './features/analytics/AnalyticsView.js';

export const App: React.FC = () => {
  const [user, setUser] = useState<any | null>(null);
  const [currentTab, setCurrentTab] = useState<'meetings' | 'kanban' | 'analytics'>('meetings');
  const [activeMeeting, setActiveMeeting] = useState<{ id: string; title: string } | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();

    if (token && storedUser) {
      setUser(storedUser);
      // Verify token freshness against backend
      apiFetch('/auth/users/me').then((res) => {
        if (res.success && res.data?.user) {
          setUser(res.data.user);
        } else {
          removeStoredToken();
          removeStoredUser();
          setUser(null);
        }
        setIsInitializing(false);
      });
    } else {
      setIsInitializing(false);
    }
  }, []);

  const handleLogout = () => {
    removeStoredToken();
    removeStoredUser();
    setUser(null);
    setActiveMeeting(null);
  };

  const handleJoinMeeting = (meetingId: string, meetingTitle: string) => {
    setActiveMeeting({ id: meetingId, title: meetingTitle });
  };

  const handleLeaveMeeting = () => {
    setActiveMeeting(null);
  };

  if (isInitializing) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0d14',
        color: '#94a3b8',
        fontSize: '1rem',
      }}>
        Initializing IntellMeet workspace...
      </div>
    );
  }

  if (!user) {
    return <AuthModal onSuccess={(newUser) => setUser(newUser)} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setActiveMeeting(null);
          setCurrentTab(tab);
        }}
        user={user}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1 }}>
        {activeMeeting ? (
          <MeetingRoom
            meetingId={activeMeeting.id}
            meetingTitle={activeMeeting.title}
            currentUser={user}
            onLeaveMeeting={handleLeaveMeeting}
            onOpenKanban={() => {
              setActiveMeeting(null);
              setCurrentTab('kanban');
            }}
          />
        ) : (
          <>
            {currentTab === 'meetings' && (
              <MeetingLobby onJoinMeeting={handleJoinMeeting} currentUser={user} />
            )}
            {currentTab === 'kanban' && <KanbanBoard />}
            {currentTab === 'analytics' && <AnalyticsView />}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
