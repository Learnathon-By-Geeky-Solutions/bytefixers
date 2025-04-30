const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Project = require('../models/Project');
const appConfig = require('../config/appConfig');
const { authenticateToken } = require('../middleware/authMiddleware');
require("dotenv").config();

// Mock dependencies
jest.mock('../models/user');
jest.mock('../models/Project');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../middleware/authMiddleware');

// Create express app and apply routes
const app = express();
app.use(express.json());

// Import routes after mocks
const userRoutes = require('../routes/userRoutes');
app.use('/api/user', userRoutes);

describe('User Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /sign-up', () => {
    it('should create a new user successfully', async () => {
      // Mock data
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        todoList: [],
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          _id: 'user123',
          name: 'Test User',
          email: 'test@example.com',
          todoList: []
        })
      };

      // Mock implementations
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('password123');
      User.mockImplementation(() => mockUser);

      // Make request
      const response = await request(app)
        .post('/api/user/sign-up')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: process.env.TEST_PASSWORD
        });

      // Assertions
      expect(response.status).toBe(201);
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(process.env.TEST_PASSWORD, 'salt');
      expect(User).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: process.env.TEST_PASSWORD,
        todoList: []
      });
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should add user to project if projectId is provided', async () => {
      // Mock data
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        todoList: [],
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          _id: 'user123',
          name: 'Test User',
          email: 'test@example.com',
          todoList: []
        })
      };

      // Mock implementations
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.mockImplementation(() => mockUser);
      Project.findByIdAndUpdate.mockResolvedValue({});

      // Make request
      const response = await request(app)
        .post('/api/user/sign-up')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: process.env.TEST_PASSWORD,
          projectId: 'project123'
        });

      // Assertions
      expect(response.status).toBe(201);
      expect(Project.findByIdAndUpdate).toHaveBeenCalledWith('project123', {
        $addToSet: { members: 'user123' }
      });
    });

    it('should handle errors during user creation', async () => {
      // Mock implementations
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.mockImplementation(() => {
        return {
          save: jest.fn().mockRejectedValue(new Error('Database error'))
        };
      });

      // Make request
      const response = await request(app)
        .post('/api/user/sign-up')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: process.env.TEST_PASSWORD,
        });

      // Assertions
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Database error');
    });
  });

  describe('POST /login', () => {
    it('should login successfully with email/password', async () => {
      // Mock user
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: process.env.TEST_PASSWORD,
        toJSON: jest.fn().mockReturnValue({
          _id: 'user123',
          email: 'test@example.com',
        })
      };

      // Mock implementations
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockImplementationOnce(() => 'accessToken')
         .mockImplementationOnce(() => 'refreshToken');

      // Make request
      const response = await request(app)
        .post('/api/user/login')
        .send({
          type: 'email',
          email: 'test@example.com',
          password: process.env.TEST_PASSWORD,
        });

      // Assertions
      expect(User.findOne).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalledWith(process.env.TEST_PASSWORD, 'password123');
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(response.body).toHaveProperty('accessToken', 'accessToken');
      expect(response.body).toHaveProperty('refreshToken', 'refreshToken');
    });

    it('should login successfully with refresh token', async () => {
      // Mock user
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        toJSON: jest.fn().mockReturnValue({
          _id: 'user123',
          email: 'test@example.com',
        })
      };

      // Mock implementations
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { _id: 'user123', email: 'test@example.com' });
      });
      User.findById.mockResolvedValue(mockUser);
      jwt.sign.mockImplementationOnce(() => 'newAccessToken')
         .mockImplementationOnce(() => 'newRefreshToken');

      // Make request
      const response = await request(app)
        .post('/api/user/login')
        .send({
          type: 'refreshToken',
          refreshToken: 'validRefreshToken'
        });

      // Assertions
      expect(jwt.verify).toHaveBeenCalled();
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(response.body).toHaveProperty('accessToken', 'newAccessToken');
      expect(response.body).toHaveProperty('refreshToken', 'newRefreshToken');
    });

    it('should handle invalid refresh token', async () => {
      // Mock implementations
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(new Error('Invalid token'), null);
      });

      // Make request
      const response = await request(app)
        .post('/api/user/login')
        .send({
          type: 'refreshToken',
          refreshToken: 'invalidToken'
        });

      // Assertions
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });

    it('should handle missing refresh token', async () => {
      // Make request
      const response = await request(app)
        .post('/api/user/login')
        .send({
          type: 'refreshToken'
        });

      // Assertions
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Refresh token is not defined');
    });
  });

  describe('GET /', () => {
    it('should get all users', async () => {
      // Mock data
      const mockUsers = [
        { _id: 'user1', name: 'User 1', email: 'user1@example.com' },
        { _id: 'user2', name: 'User 2', email: 'user2@example.com' }
      ];

      // Mock implementation
      User.find.mockResolvedValue(mockUsers);

      // Make request
      const response = await request(app).get('/api/user');

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUsers);
      expect(User.find).toHaveBeenCalledWith({});
    });

    it('should handle errors when getting all users', async () => {
      // Mock implementation
      User.find.mockRejectedValue(new Error('Database error'));

      // Make request
      const response = await request(app).get('/api/user');

      // Assertions
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Something went wrong');
    });
  });

  describe('GET /:id', () => {
    it('should get a user by id', async () => {
      // Mock data
      const mockUser = { _id: 'user123', name: 'Test User', email: 'test@example.com' };

      // Mock implementation
      User.findById.mockResolvedValue(mockUser);

      // Make request
      const response = await request(app).get('/api/user/user123');

      // Assertions
      expect(response.status).toBe(200);
      expect(User.findById).toHaveBeenCalledWith('user123');
    });

    it('should handle errors when getting a user by id', async () => {
      // Mock implementation
      User.findById.mockRejectedValue(new Error('Database error'));

      // Make request
      const response = await request(app).get('/api/user/user123');

      // Assertions
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Something went wrong');
    });
  });

  describe('PUT /profile', () => {
    beforeEach(() => {
      // Mock authenticateToken middleware
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { _id: 'user123', email: 'test@example.com' };
        next();
      });
    });

    it('should update user profile successfully', async () => {
      // Mock user
      const mockUser = {
        _id: 'user123',
        name: 'Old Name',
        email: 'old@example.com',
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          _id: 'user123',
          name: 'New Name',
          email: 'new@example.com'
        })
      };

      // Mock implementation
      User.findById.mockResolvedValue(mockUser);
      User.findOne.mockResolvedValue(null); // No duplicate email

      // Make request
      const response = await request(app)
        .put('/api/user/profile')
        .send({
          name: 'New Name',
          email: 'new@example.com'
        });

      // Assertions
      expect(response.status).toBe(200);
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockUser.name).toBe('New Name');
      expect(mockUser.save).toHaveBeenCalled();
      expect(response.body).toHaveProperty('message', 'Profile updated successfully');
    });

    it('should return 404 if user not found', async () => {
      // Mock implementation
      User.findById.mockResolvedValue(null);

      // Make request
      const response = await request(app)
        .put('/api/user/profile')
        .send({
          name: 'New Name'
        });

      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should validate email format', async () => {
      // Mock user
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com'
      };

      // Mock implementation
      User.findById.mockResolvedValue(mockUser);

      // Make request
      const response = await request(app)
        .put('/api/user/profile')
        .send({
          email: 'invalid-email'
        });

      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid email address');
    });

    it('should check for duplicate email', async () => {
      // Mock user
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com'
      };

      // Mock implementation
      User.findById.mockResolvedValue(mockUser);
      User.findOne.mockResolvedValue({ _id: 'otherUser', email: 'existing@example.com' });

      // Make request
      const response = await request(app)
        .put('/api/user/profile')
        .send({
          email: 'existing@example.com'
        });

      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email already in use');
    });
  });

  describe('PUT /password', () => {
    beforeEach(() => {
      // Mock authenticateToken middleware
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { _id: 'user123' };
        next();
      });
    });

    it('should update password successfully', async () => {
      // Mock user
      const mockUser = {
        _id: 'user123',
        password: process.env.TEST_PASSWORD,
        save: jest.fn().mockResolvedValue(true)
      };

      // Mock implementations
      User.findById.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true); // Valid current password
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('newHashedPassword');

      // Make request
      const response = await request(app)
        .put('/api/user/password')
        .send({
          currentPassword: 'currentPassword',
          newPassword: 'newPassword123'
        });

      // Assertions
      expect(response.status).toBe(200);
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(bcrypt.compare).toHaveBeenCalledWith('currentPassword', 'password123');
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 'salt');
      expect(mockUser.password).toBe('newHashedPassword');
      expect(mockUser.save).toHaveBeenCalled();
      expect(response.body.message).toBe('Password updated successfully');
    });

    it('should validate required fields', async () => {
      // Make request with missing fields
      const response = await request(app)
        .put('/api/user/password')
        .send({
          currentPassword: 'currentPassword'
          // Missing newPassword
        });

      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Both current and new password are required');
    });

    it('should validate password strength', async () => {
      // Make request with weak password
      const response = await request(app)
        .put('/api/user/password')
        .send({
          currentPassword: 'currentPassword',
          newPassword: '12345' // Too short
        });

      // Assertions
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Password must be at least 6 characters long');
    });

    it('should return 404 if user not found', async () => {
      // Mock implementation
      User.findById.mockResolvedValue(null);

      // Make request
      const response = await request(app)
        .put('/api/user/password')
        .send({
          currentPassword: 'currentPassword',
          newPassword: 'newPassword123'
        });

      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should validate current password', async () => {
      // Mock user
      const mockUser = {
        _id: 'user123',
        password: process.env.TEST_PASSWORD
      };

      // Mock implementations
      User.findById.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false); // Invalid current password

      // Make request
      const response = await request(app)
        .put('/api/user/password')
        .send({
          currentPassword: 'wrongPassword',
          newPassword: 'newPassword123'
        });

      // Assertions
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Current password is incorrect');
    });
  });

  describe('GET /profile', () => {
    beforeEach(() => {
      // Mock authenticateToken middleware
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { _id: 'user123' };
        next();
      });
    });

    it('should get current user profile', async () => {
      // Mock user
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com'
      };

      // Mock implementation
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      // Make request
      const response = await request(app).get('/api/user/profile');

      // Assertions
      expect(response.status).toBe(200);
    });
  });
});