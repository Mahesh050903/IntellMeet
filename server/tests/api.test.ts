import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('IntellMeet Backend API & Security Suite (ECC Compliance)', () => {
  let authToken = '';
  let createdMeetingId = '';
  let createdTaskId = '';

  it('GET /api/health - should return healthy system status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('healthy');
  });

  describe('Auth Module (/api/auth)', () => {
    const testEmail = `user_${Date.now()}@intellmeet.com`;
    const testPassword = 'Password123!';

    it('POST /api/auth/register - should reject invalid payloads (ECC Input Validation)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'A',
        email: 'invalid-email',
        password: '123',
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation failed');
    });

    it('POST /api/auth/register - should successfully register a new user and return JWT', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Alex Johnson',
        email: testEmail,
        password: testPassword,
        role: 'admin',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
      expect(res.body.data.tokens.accessToken).toBeDefined();

      authToken = res.body.data.tokens.accessToken;
    });

    it('POST /api/auth/login - should fail with wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testEmail,
        password: 'WrongPassword!',
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/login - should successfully login and return tokens', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testEmail,
        password: testPassword,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });

    it('GET /api/auth/users/me - should return current authenticated profile', async () => {
      const res = await request(app)
        .get('/api/auth/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Alex Johnson');
    });

    it('POST /api/auth/google - should reject payload without credential or userProfile', async () => {
      const res = await request(app).post('/api/auth/google').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/google - should successfully authenticate with Google profile and return tokens', async () => {
      const googleEmail = `google_${Date.now()}@intellmeet.com`;
      const res = await request(app).post('/api/auth/google').send({
        userProfile: {
          name: 'Google Test User',
          email: googleEmail,
          googleId: `gid_${Date.now()}`,
          avatar: 'https://example.com/avatar.png',
        },
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(googleEmail);
      expect(res.body.data.user.avatar).toBe('https://example.com/avatar.png');
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });

    it('POST /api/auth/google - should link Google login to existing user account with same email', async () => {
      const res = await request(app).post('/api/auth/google').send({
        userProfile: {
          name: 'Alex Johnson Linked',
          email: testEmail,
          googleId: `gid_link_${Date.now()}`,
          avatar: 'https://example.com/alex-google.png',
        },
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });

    describe('Email & Password + OTP Verification Suite', () => {
      let otpLoginCode = '';
      let otpRegisterCode = '';
      const otpRegEmail = `otp_reg_${Date.now()}@intellmeet.com`;

      it('POST /api/auth/login-otp-request - should fail with incorrect password', async () => {
        const res = await request(app).post('/api/auth/login-otp-request').send({
          email: testEmail,
          password: 'WrongPassword!',
        });
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });

      it('POST /api/auth/login-otp-request - should send OTP for valid credentials', async () => {
        const res = await request(app).post('/api/auth/login-otp-request').send({
          email: testEmail,
          password: testPassword,
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.email).toBe(testEmail);
        otpLoginCode = res.body.data.devOtp;
      });

      it('POST /api/auth/verify-otp - should fail with wrong OTP code', async () => {
        const res = await request(app).post('/api/auth/verify-otp').send({
          email: testEmail,
          otp: '000000',
          purpose: 'login',
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('POST /api/auth/verify-otp - should successfully log in with valid OTP', async () => {
        const res = await request(app).post('/api/auth/verify-otp').send({
          email: testEmail,
          otp: otpLoginCode,
          purpose: 'login',
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
        expect(res.body.data.tokens.accessToken).toBeDefined();
      });

      it('POST /api/auth/register-otp-request - should create OTP session with custom photo/avatar', async () => {
        const res = await request(app).post('/api/auth/register-otp-request').send({
          name: 'Priya Sharma',
          email: otpRegEmail,
          password: 'SecurePassword123!',
          avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          role: 'member',
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.email).toBe(otpRegEmail);
        otpRegisterCode = res.body.data.devOtp;
      });

      it('POST /api/auth/verify-otp - should successfully register user and preserve uploaded custom avatar', async () => {
        const res = await request(app).post('/api/auth/verify-otp').send({
          email: otpRegEmail,
          otp: otpRegisterCode,
          purpose: 'register',
        });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.user.name).toBe('Priya Sharma');
        expect(res.body.data.user.avatar).toContain('data:image/png;base64');
        expect(res.body.data.tokens.accessToken).toBeDefined();
      });
    });
  });

  describe('Meetings Module (/api/meetings)', () => {
    it('POST /api/meetings - should reject unauthenticated requests', async () => {
      const res = await request(app).post('/api/meetings').send({ title: 'Sprint Review' });
      expect(res.status).toBe(401);
    });

    it('POST /api/meetings - should create a meeting when authenticated', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Q3 Enterprise Architecture Alignment',
          passCode: '1234',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.meeting.title).toBe('Q3 Enterprise Architecture Alignment');

      createdMeetingId = res.body.data.meeting._id || res.body.data.meeting.id;
    });

    it('GET /api/meetings - should list active meetings', async () => {
      const res = await request(app)
        .get('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.meetings)).toBe(true);
      expect(res.body.data.meetings.length).toBeGreaterThan(0);
    });

    it('GET /api/meetings/:id - should return single meeting details', async () => {
      const res = await request(app)
        .get(`/api/meetings/${createdMeetingId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.meeting.title).toBe('Q3 Enterprise Architecture Alignment');
    });

    it('PATCH /api/meetings/:id - should update meeting status', async () => {
      const res = await request(app)
        .patch(`/api/meetings/${createdMeetingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'ended' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.meeting.status).toBe('ended');
    });
  });

  describe('AI Intelligence & Summarization (/api/meetings/:id/ai-summary)', () => {
    it('POST /api/meetings/:id/ai-summary - should generate structured summary and action items', async () => {
      const sampleTranscript = `
        Alex: Team, we need to finalize the database migration by Thursday.
        Sarah: I agree. We decided to use MongoDB Atlas for production.
        Alex: Sarah will configure the CI/CD pipeline by tomorrow.
        David: I will review security headers and token expiration limits.
      `;

      const res = await request(app)
        .post(`/api/meetings/${createdMeetingId}/ai-summary`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ transcript: sampleTranscript });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.executiveSummary).toBeDefined();
      expect(res.body.data.summary.decisions.length).toBeGreaterThan(0);
      expect(res.body.data.summary.actionItems.length).toBeGreaterThan(0);
    });

    it('GET /api/meetings/:id/action-items - should retrieve action items', async () => {
      const res = await request(app)
        .get(`/api/meetings/${createdMeetingId}/action-items`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.actionItems)).toBe(true);
    });
  });

  describe('Collaboration & Tasks Module (/api/tasks)', () => {
    it('POST /api/tasks - should create a new Kanban task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Implement WebRTC Screen Sharing',
          description: 'Add support for displayMedia in meeting room UI',
          status: 'todo',
          priority: 'high',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.title).toBe('Implement WebRTC Screen Sharing');

      createdTaskId = res.body.data.task._id || res.body.data.task.id;
    });

    it('PATCH /api/tasks/:id - should update task status to in-progress', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'in-progress' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.status).toBe('in-progress');
    });

    it('GET /api/tasks - should return list of all tasks', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tasks.length).toBeGreaterThan(0);
    });
  });

  describe('Analytics Module (/api/analytics)', () => {
    it('GET /api/analytics - should return computed meeting & task metrics', async () => {
      const res = await request(app)
        .get('/api/analytics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.meetings.total).toBeGreaterThan(0);
      expect(res.body.data.tasks.total).toBeGreaterThan(0);
    });
  });
});
