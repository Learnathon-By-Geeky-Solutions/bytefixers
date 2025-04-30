const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const calendarRoutes = require('../routes/calendarRoutes');
const CalendarEvent = require('../models/Calendar');
const Task = require('../models/Task');
const Subtask = require('../models/Subtask');
const Project = require('../models/Project');

describe('Calendar Routes Tests', () => {
  let mongoServer;
  let app;
  let projectId;
  let userId;
  let taskId;
  let subtaskId;
  let eventId;

  beforeAll(async () => {
    // Set up MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Set up express app
    app = express();
    app.use(express.json());
    app.use('/api/calendar', calendarRoutes);

    // Create IDs for testing
    projectId = new mongoose.Types.ObjectId();
    userId = new mongoose.Types.ObjectId();
    taskId = new mongoose.Types.ObjectId();
    subtaskId = new mongoose.Types.ObjectId();
    eventId = new mongoose.Types.ObjectId();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear collections before each test
    await CalendarEvent.deleteMany({});
    await Task.deleteMany({});
    await Subtask.deleteMany({});
    await Project.deleteMany({});

    // Create test data
    // Create a project
    const project = new Project({
      _id: projectId,
      name: 'Test Project',
      createdBy: userId,
      creator: userId
    });
    await project.save();

    // Create a task with due date
    const task = new Task({
      _id: taskId,
      title: 'Test Task',
      description: 'Test description',
      status: 'IN PROGRESS',
      priority: 'HIGH',
      team: projectId,
      dueDate: new Date('2025-05-15'),
      assignee: userId,
      reporter: userId
    });
    await task.save();

    // Create a subtask with due date
    const subtask = new Subtask({
      _id: subtaskId,
      title: 'Test Subtask',
      description: 'Test subtask description',
      status: 'IN PROGRESS',
      priority: 'MEDIUM',
      parentTask: taskId,
      dueDate: new Date('2025-05-10'),
      assignee: userId,
      reporter: userId
    });
    await subtask.save();

    // Create a calendar event
    const event = new CalendarEvent({
      _id: eventId,
      title: 'Test Calendar Event',
      description: 'Test event description',
      startDate: new Date('2025-05-01T09:00:00.000Z'),
      endDate: new Date('2025-05-01T10:00:00.000Z'),
      eventType: 'MEETING',
      status: 'SCHEDULED',
      project: projectId,
      task: taskId,
      createdBy: userId,
      participants: [userId]
    });
    await event.save();
  });

  describe('GET /project/:projectId', () => {

    it('should handle non-existent project ID', async () => {
      const fakeProjectId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/calendar/project/${fakeProjectId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /:eventId', () => {
    it('should return 404 for non-existent event', async () => {
      const fakeEventId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/calendar/${fakeEventId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Event not found');
    });

    it('should return 404 for non-existent task event', async () => {
      const fakeTaskId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/calendar/task-${fakeTaskId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Task not found');
    });
  });

  describe('POST /', () => {
    it('should return 400 for invalid event data', async () => {
      // Missing required fields
      const invalidEvent = {
        title: 'Invalid Event',
        // Missing startDate and endDate
      };

      const response = await request(app)
        .post('/api/calendar')
        .send(invalidEvent);

      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('PUT /:eventId', () => {
    it('should update a task due date', async () => {
      const updatedData = {
        startDate: new Date('2025-05-20T00:00:00.000Z')
      };

      const response = await request(app)
        .put(`/api/calendar/task-${taskId}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(`task-${taskId}`);
      
      // Verify the task's due date was updated
      const updatedTask = await Task.findById(taskId);
      expect(updatedTask.dueDate.toISOString()).toBe(updatedData.startDate.toISOString());
    });

    it('should update a subtask due date', async () => {
      const updatedData = {
        startDate: new Date('2025-05-12T00:00:00.000Z')
      };

      const response = await request(app)
        .put(`/api/calendar/subtask-${subtaskId}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(`subtask-${subtaskId}`);
      
      // Verify the subtask's due date was updated
      const updatedSubtask = await Subtask.findById(subtaskId);
      expect(updatedSubtask.dueDate.toISOString()).toBe(updatedData.startDate.toISOString());
    });

    it('should return 404 for non-existent event', async () => {
      const fakeEventId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/calendar/${fakeEventId}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Event not found');
    });
  });

  describe('DELETE /:eventId', () => {
    it('should delete a calendar event', async () => {
      const response = await request(app)
        .delete(`/api/calendar/${eventId}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Event deleted successfully');
      
      // Verify it was actually deleted
      const deletedEvent = await CalendarEvent.findById(eventId);
      expect(deletedEvent).toBeNull();
    });

    it('should not allow deleting task due dates', async () => {
      const response = await request(app)
        .delete(`/api/calendar/task-${taskId}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Cannot delete task due dates directly');
    });

    it('should not allow deleting subtask due dates', async () => {
      const response = await request(app)
        .delete(`/api/calendar/subtask-${subtaskId}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Cannot delete task due dates directly');
    });

    it('should return 404 for non-existent event', async () => {
      const fakeEventId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/calendar/${fakeEventId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Event not found');
    });
  });
});