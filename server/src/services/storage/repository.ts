import mongoose from 'mongoose';
import { UserModel } from '../../models/userModel.js';
import { MeetingModel } from '../../models/meetingModel.js';
import { MessageModel } from '../../models/messageModel.js';
import { TaskModel } from '../../models/taskModel.js';
import { TeamModel } from '../../models/teamModel.js';
import { SummaryModel } from '../../models/summaryModel.js';
import { getDBStatus } from '../../config/db.js';

// In-Memory fallback store with immutable operations
interface MemoryStore {
  users: Map<string, any>;
  meetings: Map<string, any>;
  messages: Map<string, any>;
  tasks: Map<string, any>;
  teams: Map<string, any>;
  summaries: Map<string, any>;
}

const memoryStore: MemoryStore = {
  users: new Map(),
  meetings: new Map(),
  messages: new Map(),
  tasks: new Map(),
  teams: new Map(),
  summaries: new Map(),
};

export const UserRepository = {
  async findByEmail(email: string) {
    if (getDBStatus().connected) {
      return await UserModel.findOne({ email: email.toLowerCase() }).lean();
    }
    const user = Array.from(memoryStore.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    return user ? { ...user } : null;
  },

  async findById(id: string) {
    if (getDBStatus().connected) {
      return await UserModel.findById(id).lean();
    }
    const user = memoryStore.users.get(id);
    return user ? { ...user } : null;
  },

  async findByGoogleId(googleId: string) {
    if (getDBStatus().connected) {
      return await UserModel.findOne({ googleId }).lean();
    }
    const user = Array.from(memoryStore.users.values()).find(
      (u) => u.googleId === googleId
    );
    return user ? { ...user } : null;
  },

  async updateGoogleId(id: string, googleId: string, avatar?: string) {
    if (getDBStatus().connected) {
      const updateData: any = { googleId };
      if (avatar) updateData.avatar = avatar;
      return await UserModel.findByIdAndUpdate(id, updateData, { new: true }).lean();
    }
    const user = memoryStore.users.get(id);
    if (user) {
      user.googleId = googleId;
      if (avatar) user.avatar = avatar;
      memoryStore.users.set(id, user);
      return { ...user };
    }
    return null;
  },

  async updateProfile(id: string, data: { name?: string; avatar?: string | null; twoFactorEnabled?: boolean }) {
    if (getDBStatus().connected) {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.avatar !== undefined) updateData.avatar = data.avatar;
      if (data.twoFactorEnabled !== undefined) updateData.twoFactorEnabled = data.twoFactorEnabled;
      return await UserModel.findByIdAndUpdate(id, updateData, { new: true }).lean();
    }
    const user = memoryStore.users.get(id);
    if (user) {
      if (data.name !== undefined) user.name = data.name;
      if (data.avatar !== undefined) user.avatar = data.avatar;
      if (data.twoFactorEnabled !== undefined) user.twoFactorEnabled = data.twoFactorEnabled;
      memoryStore.users.set(id, user);
      return { ...user };
    }
    return null;
  },

  async updatePassword(id: string, passwordHash: string) {
    if (getDBStatus().connected) {
      return await UserModel.findByIdAndUpdate(id, { passwordHash }, { new: true }).lean();
    }
    const user = memoryStore.users.get(id);
    if (user) {
      user.passwordHash = passwordHash;
      memoryStore.users.set(id, user);
      return { ...user };
    }
    return null;
  },

  async create(userData: {
    name: string;
    email: string;
    passwordHash?: string;
    avatar?: string;
    googleId?: string;
    authProvider?: 'local' | 'google';
    role?: 'admin' | 'member' | 'guest';
    teamIds?: string[];
  }) {
    if (getDBStatus().connected) {
      const doc = await UserModel.create({
        ...userData,
        email: userData.email.toLowerCase(),
      });
      return doc.toObject();
    }
    const id = 'usr_' + Math.random().toString(36).substring(2, 11);
    const newUser = {
      _id: id,
      id,
      ...userData,
      email: userData.email.toLowerCase(),
      role: userData.role || 'member',
      teamIds: userData.teamIds || [],
      authProvider: userData.authProvider || 'local',
      createdAt: new Date().toISOString(),
    };
    memoryStore.users.set(id, newUser);
    return { ...newUser };
  },
};

export const MeetingRepository = {
  async create(data: {
    title: string;
    hostId: string;
    hostName: string;
    teamId?: string;
    participants?: any[];
    startTime?: Date;
    status?: 'scheduled' | 'active' | 'ended' | 'cancelled';
  }) {
    if (getDBStatus().connected) {
      const doc = await MeetingModel.create({
        ...data,
        participants: data.participants || [{ userId: data.hostId, name: data.hostName, joinedAt: new Date() }],
      });
      return doc.toObject();
    }
    const id = 'meet_' + Math.random().toString(36).substring(2, 11);
    const newMeeting = {
      _id: id,
      id,
      ...data,
      participants: data.participants || [{ userId: data.hostId, name: data.hostName, joinedAt: new Date().toISOString() }],
      startTime: data.startTime || new Date().toISOString(),
      status: data.status || 'active',
      createdAt: new Date().toISOString(),
    };
    memoryStore.meetings.set(id, newMeeting);
    return { ...newMeeting };
  },

  async findById(id: string) {
    if (getDBStatus().connected) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          return await MeetingModel.findById(id).lean();
        }
        return await MeetingModel.findOne({ id }).lean();
      } catch {
        return null;
      }
    }
    const meeting = memoryStore.meetings.get(id);
    return meeting ? { ...meeting } : null;
  },

  async findAll() {
    if (getDBStatus().connected) {
      return await MeetingModel.find().sort({ createdAt: -1 }).lean();
    }
    return Array.from(memoryStore.meetings.values()).map((m) => ({ ...m }));
  },

  async update(id: string, updates: Partial<any>) {
    if (getDBStatus().connected) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          return await MeetingModel.findByIdAndUpdate(id, updates, { new: true }).lean();
        }
        return await MeetingModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
      } catch {
        return null;
      }
    }
    const current = memoryStore.meetings.get(id);
    if (!current) return null;
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    memoryStore.meetings.set(id, updated);
    return { ...updated };
  },

  async delete(id: string) {
    if (getDBStatus().connected) {
      return await MeetingModel.findByIdAndDelete(id);
    }
    return memoryStore.meetings.delete(id);
  },
};

export const MessageRepository = {
  async create(data: { meetingId: string; senderId: string; senderName: string; senderAvatar?: string; text: string }) {
    if (getDBStatus().connected) {
      const doc = await MessageModel.create(data);
      return doc.toObject();
    }
    const id = 'msg_' + Math.random().toString(36).substring(2, 11);
    const newMsg = {
      _id: id,
      id,
      ...data,
      createdAt: new Date().toISOString(),
    };
    memoryStore.messages.set(id, newMsg);
    return { ...newMsg };
  },

  async findByMeetingId(meetingId: string) {
    if (getDBStatus().connected) {
      return await MessageModel.find({ meetingId }).sort({ createdAt: 1 }).lean();
    }
    return Array.from(memoryStore.messages.values())
      .filter((m) => m.meetingId === meetingId)
      .map((m) => ({ ...m }));
  },
};

export const TaskRepository = {
  async create(data: {
    teamId?: string;
    title: string;
    description?: string;
    assigneeId?: string;
    assigneeName?: string;
    status?: 'todo' | 'in-progress' | 'done';
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string | Date;
    sourceMeetingId?: string;
  }) {
    if (getDBStatus().connected) {
      const doc = await TaskModel.create(data);
      return doc.toObject();
    }
    const id = 'task_' + Math.random().toString(36).substring(2, 11);
    const newTask = {
      _id: id,
      id,
      ...data,
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      createdAt: new Date().toISOString(),
    };
    memoryStore.tasks.set(id, newTask);
    return { ...newTask };
  },

  async findAll() {
    if (getDBStatus().connected) {
      return await TaskModel.find().sort({ createdAt: -1 }).lean();
    }
    return Array.from(memoryStore.tasks.values()).map((t) => ({ ...t }));
  },

  async update(id: string, updates: Partial<any>) {
    if (getDBStatus().connected) {
      return await TaskModel.findByIdAndUpdate(id, updates, { new: true }).lean();
    }
    const current = memoryStore.tasks.get(id);
    if (!current) return null;
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    memoryStore.tasks.set(id, updated);
    return { ...updated };
  },
};

export const SummaryRepository = {
  async saveSummary(data: {
    meetingId: string;
    executiveSummary: string;
    keyPoints: string[];
    decisions: string[];
    actionItems: Array<{ title: string; description: string; assigneeName?: string; dueDate?: string }>;
  }) {
    if (getDBStatus().connected) {
      const doc = await SummaryModel.findOneAndUpdate(
        { meetingId: data.meetingId },
        data,
        { upsert: true, new: true }
      ).lean();
      return doc;
    }
    const id = 'sum_' + Math.random().toString(36).substring(2, 11);
    const newSummary = {
      _id: id,
      id,
      ...data,
      createdAt: new Date().toISOString(),
    };
    memoryStore.summaries.set(data.meetingId, newSummary);
    return { ...newSummary };
  },

  async findByMeetingId(meetingId: string) {
    if (getDBStatus().connected) {
      return await SummaryModel.findOne({ meetingId }).lean();
    }
    const summary = memoryStore.summaries.get(meetingId);
    return summary ? { ...summary } : null;
  },
};
