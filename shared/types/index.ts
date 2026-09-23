// IntellMeet Shared Types & Interfaces

export type UserRole = 'admin' | 'member' | 'guest';

export interface IUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  teamIds: string[];
  createdAt: string;
}

export interface ITeam {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  createdAt: string;
}

export type MeetingStatus = 'scheduled' | 'active' | 'ended' | 'cancelled';

export interface IMeetingParticipant {
  userId: string;
  name: string;
  avatar?: string;
  joinedAt?: string;
  leftAt?: string;
}

export interface IMeeting {
  id: string;
  title: string;
  hostId: string;
  hostName: string;
  teamId?: string;
  participants: IMeetingParticipant[];
  startTime: string;
  endTime?: string;
  status: MeetingStatus;
  passCode?: string;
  recordingUrl?: string;
  createdAt: string;
}

export interface IMessage {
  id: string;
  meetingId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  createdAt: string;
}

export interface ITranscriptEntry {
  id: string;
  meetingId: string;
  speakerId: string;
  speakerName: string;
  text: string;
  timestamp: string;
}

export interface ISummary {
  id: string;
  meetingId: string;
  executiveSummary: string;
  keyPoints: string[];
  decisions: string[];
  createdAt: string;
}

export interface IActionItem {
  id: string;
  meetingId: string;
  title: string;
  description: string;
  assigneeId?: string;
  assigneeName?: string;
  status: 'open' | 'in-progress' | 'completed';
  dueDate?: string;
}

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface ITask {
  id: string;
  teamId?: string;
  title: string;
  description: string;
  assigneeId?: string;
  assigneeName?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  sourceMeetingId?: string;
  createdAt: string;
}

export type NotificationType = 'meeting_invite' | 'task_assigned' | 'mention' | 'summary_ready';

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  relatedId?: string;
  createdAt: string;
}

// WebRTC & Socket.io Signaling Interfaces
export interface IRoomPeer {
  socketId: string;
  userId: string;
  name: string;
  avatar?: string;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
}

export interface ISignalPayload {
  toSocketId: string;
  fromSocketId: string;
  signal: any;
}

// Standard API Response Envelope (ECC Architectural Pattern)
export interface IApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}
