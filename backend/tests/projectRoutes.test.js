const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const projectRoutes = require('../routes/projectRoutes');
const Project = require('../models/Project');
const User = require('../models/user');
const Task = require('../models/Task'); // Assuming you have a Task model

describe('Project Routes Tests', () => {
  let app;
  let mongoServer;
  let testUser;
  let testProject;
  let testTask;

  beforeAll(async () => {
    // Set up MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Set up Express app
    app = express();
    app.use(express.json());
    app.use('/projects', projectRoutes);
  });

  beforeEach(async () => {
    // Clear collections before each test
    await User.deleteMany({});
    await Project.deleteMany({});
    if (mongoose.models.Task) {
      await Task.deleteMany({});
    }

    // Create test user
    testUser = new User({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    });
    await testUser.save();

    // Create test project
    testProject = new Project({
      name: 'Test Project',
      description: 'A test project',
      members: [testUser._id],
      createdBy: testUser._id,
      status: 'Planning'
    });
    await testProject.save();

    // Create test task if Task model exists
    if (mongoose.models.Task) {
      testTask = new Task({
        title: 'Test Task',
        description: 'A test task',
        assignee: testUser._id,
        reporter: testUser._id,
        status: 'TO DO',
        priority: 'MEDIUM',
        dueDate: new Date(),
        createdBy: testUser._id
      });
      await testTask.save();
      
      // Link task to project
      testProject.task = testProject.task || [];
      testProject.task.push(testTask._id);
      await testProject.save();
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('POST /projects/create', () => {
    it('should create a new project with valid data', async () => {
      const projectData = {
        name: 'New Project',
        team: [testUser._id],
        createdBy: testUser._id.toString(),
        description: 'A new test project',
        status: 'Planning'
      };

      const response = await request(app)
        .post('/projects/create')
        .send(projectData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(projectData.name);
      expect(response.body.description).toBe(projectData.description);
      expect(response.body.status).toBe(projectData.status);
      expect(response.body.members).toContainEqual(testUser._id.toString());
    });

    it('should use default status if not provided', async () => {
      const projectData = {
        name: 'New Project No Status',
        team: [testUser._id],
        createdBy: testUser._id.toString(),
        description: 'A new test project'
      };

      const response = await request(app)
        .post('/projects/create')
        .send(projectData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('Planning');
    });

    it('should return 500 with invalid data', async () => {
      // Missing required field (name)
      const projectData = {
        team: [testUser._id],
        createdBy: testUser._id.toString(),
        description: 'A new test project',
        status: 'Planning'
      };

      const response = await request(app)
        .post('/projects/create')
        .send(projectData);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /projects', () => {
    it('should return all projects', async () => {
      const response = await request(app).get('/projects');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /projects/:id', () => {
    it('should return a project by ID', async () => {
      const response = await request(app).get(`/projects/${testProject._id}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(testProject._id.toString());
      expect(response.body.name).toBe(testProject.name);
    });

    it('should return 404 for non-existent project ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/projects/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Project not found');
    });

    it('should return 500 for invalid project ID format', async () => {
      const response = await request(app).get('/projects/invalid-id');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /projects/:id', () => {
    it('should update a project with valid data', async () => {
      const updates = {
        name: 'Updated Project Name',
        description: 'Updated project description'
      };

      const response = await request(app)
        .put(`/projects/${testProject._id}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updates.name);
      expect(response.body.description).toBe(updates.description);
    });

    it('should return 404 for non-existent project ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updates = { name: 'Updated Project Name' };
      
      const response = await request(app)
        .put(`/projects/${nonExistentId}`)
        .send(updates);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Project not found');
    });

    it('should return 500 for invalid project ID format', async () => {
      const updates = { name: 'Updated Project Name' };
      
      const response = await request(app)
        .put('/projects/invalid-id')
        .send(updates);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /projects/:id', () => {
    it('should delete a project', async () => {
      const response = await request(app).delete(`/projects/${testProject._id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Project deleted successfully');

      // Verify project is deleted
      const deletedProject = await Project.findById(testProject._id);
      expect(deletedProject).toBeNull();
    });

    it('should return 404 for non-existent project ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app).delete(`/projects/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Project not found');
    });

    it('should return 500 for invalid project ID format', async () => {
      const response = await request(app).delete('/projects/invalid-id');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /projects/:projectId/tasks', () => {
    it('should return 404 for non-existent project ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/projects/${nonExistentId}/tasks`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Project not found');
    });

    it('should return 500 for invalid project ID format', async () => {
      const response = await request(app).get('/projects/invalid-id/tasks');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /projects/user/:userId', () => {
    it('should return all projects for a user', async () => {
      const response = await request(app).get(`/projects/user/${testUser._id}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]._id).toBe(testProject._id.toString());
    });

    it('should return empty array for user with no projects', async () => {
      const newUser = new User({
        email: 'noproject@example.com',
        password: 'password123',
        name: 'No Project User'
      });
      await newUser.save();

      const response = await request(app).get(`/projects/user/${newUser._id}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(0);
    });

    it('should return 500 for invalid user ID format', async () => {
      const response = await request(app).get('/projects/user/invalid-id');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Error fetching projects');
    });
  });

  describe('POST /projects/addUserToProject', () => {
    it('should add a user to a project', async () => {
      const newUser = new User({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User'
      });
      await newUser.save();

      const requestData = {
        userId: newUser._id.toString(),
        projectId: testProject._id.toString()
      };

      const response = await request(app)
        .post('/projects/addUserToProject')
        .send(requestData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User added to project');
      
      // Verify user is added to project
      const updatedProject = await Project.findById(testProject._id);
      expect(updatedProject.members).toContainEqual(newUser._id);
    });

    it('should return 400 if user is already a member', async () => {
      const requestData = {
        userId: testUser._id.toString(),
        projectId: testProject._id.toString()
      };

      const response = await request(app)
        .post('/projects/addUserToProject')
        .send(requestData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User is already a member of this project');
    });

    it('should return 400 if userId or projectId is missing', async () => {
      // Missing userId
      let response = await request(app)
        .post('/projects/addUserToProject')
        .send({ projectId: testProject._id.toString() });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User ID and Project ID are required');

      // Missing projectId
      response = await request(app)
        .post('/projects/addUserToProject')
        .send({ userId: testUser._id.toString() });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User ID and Project ID are required');
    });

    it('should return 404 for non-existent project ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const requestData = {
        userId: testUser._id.toString(),
        projectId: nonExistentId.toString()
      };

      const response = await request(app)
        .post('/projects/addUserToProject')
        .send(requestData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Project not found');
    });

    it('should return 500 for invalid project ID format', async () => {
      const requestData = {
        userId: testUser._id.toString(),
        projectId: 'invalid-id'
      };

      const response = await request(app)
        .post('/projects/addUserToProject')
        .send(requestData);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
});