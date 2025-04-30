const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const emailRoutes = require('../routes/sendEmailRoutes');
const Project = require('../models/Project');
const User = require('../models/user');
require("dotenv").config();


// Mock the email configuration module
jest.mock('../config/emailConfig', () => {
  return jest.fn().mockImplementation(() => {
    return Promise.resolve();
  });
});

describe('Email Routes Tests', () => {
  let app;
  let mongoServer;
  let testUser;
  let testProject;

  beforeAll(async () => {
    // Set up MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Set up Express app
    app = express();
    app.use(express.json());
    app.use('/sendEmail', emailRoutes);
  });

  beforeEach(async () => {
    // Clear collections before each test
    await User.deleteMany({});
    await Project.deleteMany({});

    // Create test user
    testUser = new User({
      email: 'existing@example.com',
      password: process.env.TEST_PASSWORD,
      name: 'Test User'
    });
    await testUser.save();

    // Create test project
    testProject = new Project({
      name: 'Test Project',
      description: 'A test project',
      members: [],
      owner: testUser._id,
      createdBy: testUser._id    // Adding the required createdBy field
    });
    await testProject.save();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('POST /sendEmail/send-invite', () => {
    it('should return 400 if email is missing', async () => {
      const response = await request(app)
        .post('/sendEmail/send-invite')
        .send({ projectId: testProject._id.toString() });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and Project ID are required');
    });

    it('should return 400 if projectId is missing', async () => {
      const response = await request(app)
        .post('/sendEmail/send-invite')
        .send({ email: 'new@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and Project ID are required');
    });

    it('should return 400 if email format is invalid', async () => {
      const response = await request(app)
        .post('/sendEmail/send-invite')
        .send({ 
          email: 'invalid-email', 
          projectId: testProject._id.toString() 
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid email format');
    });

    it('should send invite and return 200 for valid inputs', async () => {
      const response = await request(app)
        .post('/sendEmail/send-invite')
        .send({ 
          email: 'new@example.com', 
          projectId: testProject._id.toString() 
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Invitation sent successfully!');
    });

    it('should handle errors during email sending', async () => {
      // Mock the email config to throw an error
      const emailConfig = require('../config/emailConfig');
      emailConfig.mockImplementationOnce(() => {
        throw new Error('Email sending failed');
      });

      const response = await request(app)
        .post('/sendEmail/send-invite')
        .send({ 
          email: 'new@example.com', 
          projectId: testProject._id.toString() 
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to send invitation');
    });
  });

  describe('GET /sendEmail/accept-invite', () => {
    it('should return 400 if email is missing', async () => {
      const response = await request(app)
        .get(`/sendEmail/accept-invite?projectId=${testProject._id.toString()}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and Project ID are required');
    });

    it('should return 400 if projectId is missing', async () => {
      const response = await request(app)
        .get('/sendEmail/accept-invite?email=new@example.com');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and Project ID are required');
    });

    it('should redirect to signup if user does not exist', async () => {
      const response = await request(app)
        .get(`/sendEmail/accept-invite?email=new@example.com&projectId=${testProject._id.toString()}`);

      expect(response.status).toBe(302); // Redirect status
      expect(response.header.location).toBe(
        `http://localhost:3000/signup?email=new@example.com&projectId=${testProject._id.toString()}`
      );
    });

    it('should add existing user to project and redirect to login', async () => {
      const response = await request(app)
        .get(`/sendEmail/accept-invite?email=existing@example.com&projectId=${testProject._id.toString()}`);

      expect(response.status).toBe(302); // Redirect status
      expect(response.header.location).toBe(
        `http://localhost:3000/login?email=existing@example.com&projectId=${testProject._id.toString()}`
      );

      // Verify the user was added to the project
      const updatedProject = await Project.findById(testProject._id);
      expect(updatedProject.members).toContainEqual(testUser._id);
    });

    it('should not add user to project if already a member', async () => {
      // First add the user to the project
      testProject.members.push(testUser._id);
      await testProject.save();

      const response = await request(app)
        .get(`/sendEmail/accept-invite?email=existing@example.com&projectId=${testProject._id.toString()}`);

      expect(response.status).toBe(302); // Redirect status
      
      // Verify the user is still in the project (no duplicates)
      const updatedProject = await Project.findById(testProject._id);
      expect(updatedProject.members.length).toBe(1);
      expect(updatedProject.members).toContainEqual(testUser._id);
    });

    it('should handle errors during invitation acceptance', async () => {
      // Mock Project.findById to throw an error
      jest.spyOn(Project, 'findById').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      const response = await request(app)
        .get(`/sendEmail/accept-invite?email=existing@example.com&projectId=${testProject._id.toString()}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to process invitation');
    });
  });
});