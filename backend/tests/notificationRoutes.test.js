const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');
const notificationRoutes = require('../routes/notificationRoutes');
const Notification = require('../models/Notification');
const Project = require('../models/Project');
const Task = require('../models/Task');

// Mock models
jest.mock('../models/Notification');
jest.mock('../models/Project');
jest.mock('../models/Task');

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/notifications', notificationRoutes);

describe('Notification Routes', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockProjectId = new mongoose.Types.ObjectId().toString();
  const mockTaskId = new mongoose.Types.ObjectId().toString();
  const mockNotificationId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/notifications/user/:userId', () => {
    it('should get notifications for a user', async () => {
      const mockNotifications = [
        {
          _id: mockNotificationId,
          message: 'Test notification',
          type: 'task_update',
          projectId: { _id: mockProjectId, name: 'Test Project' },
          taskId: { _id: mockTaskId, title: 'Test Task' },
          createdBy: { _id: mockUserId, name: 'Test User', email: 'test@example.com' },
          recipients: [mockUserId],
          read: [],
          createdAt: new Date()
        }
      ];

      Notification.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockNotifications)
      });

      Notification.countDocuments.mockResolvedValue(1);

      const response = await request(app).get(`/api/notifications/user/${mockUserId}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('notifications');
      expect(response.body.notifications).toEqual(expect.arrayContaining([
        expect.objectContaining({
          message: 'Test notification',
          type: 'task_update'
        })
      ]));
      expect(response.body).toHaveProperty('total', 1);
      expect(Notification.find).toHaveBeenCalledWith({
        recipients: mockUserId
      });
    });

    it('should handle errors when fetching notifications', async () => {
      Notification.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app).get(`/api/notifications/user/${mockUserId}`);
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Database error');
    });
  });

  describe('POST /api/notifications', () => {
    it('should return 404 if project not found', async () => {
      Project.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const notificationData = {
        message: 'Test notification',
        type: 'task_assigned',
        projectId: mockProjectId,
        taskId: mockTaskId,
        createdBy: mockUserId,
        isImportant: true
      };

      const response = await request(app)
        .post('/api/notifications')
        .send(notificationData);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Project not found');
    });

    it('should handle errors when creating notification', async () => {
      Project.findById.mockImplementation(() => {
        throw new Error('Database error');
      });

      const notificationData = {
        message: 'Test notification',
        type: 'task_assigned',
        projectId: mockProjectId,
        taskId: mockTaskId,
        createdBy: mockUserId,
        isImportant: true
      };

      const response = await request(app)
        .post('/api/notifications')
        .send(notificationData);
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Database error');
    });
  });

  describe('PUT /api/notifications/:notificationId/read', () => {
    it('should mark a notification as read', async () => {
      const mockNotification = {
        _id: mockNotificationId,
        read: [],
        save: jest.fn().mockResolvedValue(true)
      };

      Notification.findById.mockResolvedValue(mockNotification);

      const response = await request(app)
        .put(`/api/notifications/${mockNotificationId}/read`)
        .send({ userId: mockUserId });
      
      expect(response.status).toBe(200);
      expect(Notification.findById).toHaveBeenCalledWith(mockNotificationId);
      expect(mockNotification.save).toHaveBeenCalled();
      expect(mockNotification.read).toContainEqual(
        expect.objectContaining({ userId: mockUserId })
      );
    });

    it('should not add duplicate read entry', async () => {
      const mockNotification = {
        _id: mockNotificationId,
        read: [{ userId: mockUserId, readAt: new Date() }],
        save: jest.fn().mockResolvedValue(true)
      };

      Notification.findById.mockResolvedValue(mockNotification);

      const response = await request(app)
        .put(`/api/notifications/${mockNotificationId}/read`)
        .send({ userId: mockUserId });
      
      expect(response.status).toBe(200);
      expect(mockNotification.save).not.toHaveBeenCalled();
      expect(mockNotification.read).toHaveLength(1);
    });

    it('should return 404 if notification not found', async () => {
      Notification.findById.mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/notifications/${mockNotificationId}/read`)
        .send({ userId: mockUserId });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Notification not found');
    });
  });

  describe('PUT /api/notifications/mark-all-read', () => {
    it('should mark all notifications as read for a user', async () => {
      const mockNotifications = [
        {
          _id: mockNotificationId,
          read: [],
          save: jest.fn().mockResolvedValue(true)
        },
        {
          _id: new mongoose.Types.ObjectId().toString(),
          read: [],
          save: jest.fn().mockResolvedValue(true)
        }
      ];

      Notification.find.mockResolvedValue(mockNotifications);

      const response = await request(app)
        .put('/api/notifications/mark-all-read')
        .send({ userId: mockUserId });
      
      expect(response.status).toBe(200);
      expect(Notification.find).toHaveBeenCalledWith({ 
        recipients: expect.any(mongoose.Types.ObjectId) 
      });
      expect(mockNotifications[0].save).toHaveBeenCalled();
      expect(mockNotifications[1].save).toHaveBeenCalled();
      expect(mockNotifications[0].read).toContainEqual(
        expect.objectContaining({ userId: mockUserId })
      );
    });

    it('should handle invalid userId', async () => {
      const response = await request(app)
        .put('/api/notifications/mark-all-read')
        .send({ userId: 'invalid-id' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid user ID format');
    });
  });

  describe('DELETE /api/notifications/clear-all', () => {
    it('should clear all notifications for a user', async () => {
      const mockNotifications = [
        {
          _id: mockNotificationId,
          recipients: [mockUserId, new mongoose.Types.ObjectId().toString()],
          save: jest.fn().mockResolvedValue(true)
        },
        {
          _id: new mongoose.Types.ObjectId().toString(),
          recipients: [mockUserId],
          save: jest.fn().mockResolvedValue(true)
        }
      ];

      Notification.find.mockResolvedValue(mockNotifications);
      Notification.findByIdAndDelete = jest.fn().mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/notifications/clear-all')
        .send({ userId: mockUserId });
      
      expect(response.status).toBe(200);
      expect(Notification.find).toHaveBeenCalledWith({ 
        recipients: expect.any(mongoose.Types.ObjectId) 
      });
      expect(mockNotifications[0].save).toHaveBeenCalled();
      expect(Notification.findByIdAndDelete).toHaveBeenCalledWith(mockNotifications[1]._id);
    });

    it('should handle invalid userId', async () => {
      const response = await request(app)
        .delete('/api/notifications/clear-all')
        .send({ userId: 'invalid-id' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid user ID format');
    });
  });

  describe('DELETE /api/notifications/:notificationId', () => {
    it('should remove a user from notification recipients', async () => {
      const updatedNotification = {
        _id: mockNotificationId,
        recipients: [new mongoose.Types.ObjectId().toString()]
      };

      Notification.findOneAndUpdate.mockResolvedValue(updatedNotification);

      const response = await request(app)
        .delete(`/api/notifications/${mockNotificationId}`)
        .send({ userId: mockUserId });
      
      expect(response.status).toBe(200);
      expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockNotificationId },
        { $pull: { recipients: mockUserId } },
        { new: true }
      );
    });

    it('should delete notification if no recipients left', async () => {
      const updatedNotification = {
        _id: mockNotificationId,
        recipients: []
      };

      Notification.findOneAndUpdate.mockResolvedValue(updatedNotification);
      Notification.findByIdAndDelete = jest.fn().mockResolvedValue(true);

      const response = await request(app)
        .delete(`/api/notifications/${mockNotificationId}`)
        .send({ userId: mockUserId });
      
      expect(response.status).toBe(200);
      expect(Notification.findByIdAndDelete).toHaveBeenCalledWith(mockNotificationId);
    });

    it('should return 404 if notification not found', async () => {
      Notification.findOneAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .delete(`/api/notifications/${mockNotificationId}`)
        .send({ userId: mockUserId });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Notification not found');
    });
  });

  describe('GET /api/notifications/unread-count/:userId', () => {
    it('should get unread count for a user', async () => {
      Notification.countDocuments.mockResolvedValue(5);

      const response = await request(app)
        .get(`/api/notifications/unread-count/${mockUserId}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('unreadCount', 5);
      expect(Notification.countDocuments).toHaveBeenCalledWith({
        recipients: mockUserId,
        'read.userId': { $ne: mockUserId }
      });
    });

    it('should handle errors when getting unread count', async () => {
      Notification.countDocuments.mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app)
        .get(`/api/notifications/unread-count/${mockUserId}`);
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Database error');
    });
  });
});