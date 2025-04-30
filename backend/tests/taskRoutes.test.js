const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const taskRoutes = require('../routes/taskRoutes');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Subtask = require('../models/Subtask');

let mongoServer;
const app = express();
app.use(express.json());
app.use('/api/tasks', taskRoutes);

// Mock data
const mockUser = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Test User',
  email: 'test@example.com'
};

// Updated mockProject with required fields
const mockProject = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Test Project',          // Changed from title to name
  description: 'Test Description',
  task: [],
  progress: 0,
  createdBy: mockUser._id        // Added required createdBy field
};

const mockTask = {
  _id: new mongoose.Types.ObjectId(),
  title: 'Test Task',
  description: 'Test Description',
  assignee: [mockUser._id],
  reporter: mockUser._id,
  dueDate: new Date(),
  priority: 'MEDIUM',
  status: 'BACKLOG',
  subTask: [],
  team: null,
  activityLog: [],
  completedAt: null
};

const mockSubtask = {
  _id: new mongoose.Types.ObjectId(),
  title: 'Test Subtask',
  description: 'Test Description',
  status: 'TO DO',
  priority: 'LOW',
  reporter: mockUser._id,
  parentTask: mockTask._id,
  assignee: [mockUser._id],
  dueDate: new Date(),
  createdBy: mockUser._id,
  activityLog: [],
  completedAt: null
};

// Connect to in-memory MongoDB before tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Clear database between tests
beforeEach(async () => {
  await Project.deleteMany({});
  await Task.deleteMany({});
  await Subtask.deleteMany({});
  
  // Setup initial test data
  mockProject.task = [mockTask._id];
  mockTask.subTask = [mockSubtask._id];
  
  await new Project(mockProject).save();
  await new Task(mockTask).save();
  await new Subtask(mockSubtask).save();
});

// Disconnect after tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Task Routes', () => {
  // Create a task
  describe('POST /:projectId/addTasks', () => {
    it('should create a new task under a project', async () => {
      const newTask = {
        title: 'New Task',
        description: 'New Description',
        assignee: mockUser._id,
        reporter: mockUser._id,
        priority: 'HIGH',
        status: 'TO DO'
      };

      const response = await request(app)
        .post(`/api/tasks/${mockProject._id}/addTasks`)
        .send(newTask)
        .expect(200);

      expect(response.body).toHaveProperty('title', newTask.title);
      expect(response.body).toHaveProperty('description', newTask.description);
      
      // Verify project was updated
      const project = await Project.findById(mockProject._id);
      expect(project.task.length).toBe(2);
    });

    it('should return 404 if project not found', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      
      await request(app)
        .post(`/api/tasks/${invalidId}/addTasks`)
        .send({
          title: 'Invalid Task',
          description: 'This should fail',
          reporter: mockUser._id
        })
        .expect(404);
    });
  });

  // Rest of the test code remains the same...
  // Update a task
  describe('PUT /:projectId/tasks/:taskId/update', () => {
    it('should update a task', async () => {
      const updates = {
        title: 'Updated Task Title',
        description: 'Updated Description',
        userId: mockUser._id,
        actionDescription: 'Task Updated'
      };

      const response = await request(app)
        .put(`/api/tasks/${mockProject._id}/tasks/${mockTask._id}/update`)
        .send(updates)
        .expect(200);

      expect(response.body).toHaveProperty('title', updates.title);
      expect(response.body).toHaveProperty('description', updates.description);
      expect(response.body.activityLog).toHaveLength(1);
    });

    it('should return 404 if task not found', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      
      await request(app)
        .put(`/api/tasks/${mockProject._id}/tasks/${invalidId}/update`)
        .send({ title: 'Invalid Update' })
        .expect(404);
    });
  });

  // Create a subtask
  describe('POST /:taskId/add-subtask', () => {

    it('should return 404 if parent task not found', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      
      await request(app)
        .post(`/api/tasks/${invalidId}/add-subtask`)
        .send({
          title: 'Invalid Subtask',
          userId: mockUser._id
        })
        .expect(404);
    });
  });

  // Get subtasks
  describe('GET /:taskId/subtasks', () => {

    it('should return 500 if task not found', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      
      // Mock findById to return null
      jest.spyOn(Task, 'findById').mockImplementationOnce(() => ({
        prePopulate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(null)
      }));
      
      await request(app)
        .get(`/api/tasks/${invalidId}/subtasks`)
        .expect(500);
    });
  });

  // Update a subtask
  describe('PUT /subtask/:subtaskId', () => {

    it('should return 404 if subtask not found', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      
      // Mock findById to return null
      jest.spyOn(Subtask, 'findById').mockImplementationOnce(() => 
        Promise.resolve(null)
      );
      
      await request(app)
        .put(`/api/tasks/subtask/${invalidId}`)
        .send({ title: 'Invalid Update' })
        .expect(404);
    });
  });

  // Delete a subtask
  describe('DELETE /subtask/:subtaskId', () => {
    it('should delete a subtask', async () => {
      // Mock subtask lookup
      jest.spyOn(Subtask, 'findById').mockResolvedValueOnce({
        ...mockSubtask,
        parentTask: mockTask._id
      });

      // Mock findByIdAndDelete
      jest.spyOn(Subtask, 'findByIdAndDelete').mockResolvedValueOnce({
        ...mockSubtask
      });

      // Mock parent task lookup and save
      jest.spyOn(Task, 'findById').mockResolvedValueOnce({
        ...mockTask,
        subTask: [mockSubtask._id, new mongoose.Types.ObjectId()],
        activityLog: [],
        save: jest.fn().mockResolvedValue(true)
      });

      const response = await request(app)
        .delete(`/api/tasks/subtask/${mockSubtask._id}`)
        .send({ userId: mockUser._id })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Subtask deleted successfully');
      expect(response.body).toHaveProperty('subtaskId', mockSubtask._id.toString());
    });

    it('should return 404 if subtask not found', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      
      // Mock subtask lookup to return null
      jest.spyOn(Subtask, 'findById').mockResolvedValueOnce(null);
      
      await request(app)
        .delete(`/api/tasks/subtask/${invalidId}`)
        .send({ userId: mockUser._id })
        .expect(404);
    });
  });

  // Get all tasks for a project
  describe('GET /:projectId', () => {
    it('should get all tasks for a project', async () => {
      // Mock tasks array
      const mockTasks = [
        { ...mockTask, assignee: [mockUser], reporter: mockUser },
        { 
          _id: new mongoose.Types.ObjectId(),
          title: 'Second Task',
          assignee: [mockUser],
          reporter: mockUser
        }
      ];
      
      // Mock Project.findById
      jest.spyOn(Project, 'findById').mockResolvedValueOnce(mockProject);
      
      // Mock Task.find
      jest.spyOn(Task, 'find').mockImplementationOnce(() => ({
        populate: jest.fn().mockResolvedValue(mockTasks)
      }));

      const response = await request(app)
        .get(`/api/tasks/${mockProject._id}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('title');
    });

    it('should return 404 if project not found', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      
      // Mock Project.findById to return null
      jest.spyOn(Project, 'findById').mockResolvedValueOnce(null);
      
      await request(app)
        .get(`/api/tasks/${invalidId}`)
        .expect(404);
    });
  });

  // Update a task (general update)
  describe('PUT /:taskId', () => {
    it('should return 404 if task not found', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      
      // Mock Task.findById to return null
      jest.spyOn(Task, 'findById').mockResolvedValueOnce(null);
      
      await request(app)
        .put(`/api/tasks/${invalidId}`)
        .send({ title: 'Invalid Update' })
        .expect(404);
    });
  });

  // Delete a task
  describe('DELETE /:taskId', () => {
    it('should delete a task and handle project updates', async () => {
      // Mock Task.findById
      jest.spyOn(Task, 'findById').mockResolvedValueOnce({
        ...mockTask,
        subTask: [mockSubtask._id]
      });

      // Mock Project.findOne
      jest.spyOn(Project, 'findOne').mockResolvedValueOnce({
        ...mockProject,
        task: [mockTask._id, new mongoose.Types.ObjectId()],
        save: jest.fn().mockResolvedValue(true)
      });

      // Mock Subtask.deleteMany
      jest.spyOn(Subtask, 'deleteMany').mockResolvedValueOnce({ deletedCount: 1 });

      // Mock Task.findByIdAndDelete
      jest.spyOn(Task, 'findByIdAndDelete').mockResolvedValueOnce({
        ...mockTask
      });

      // Mock Task.find for progress recalculation
      jest.spyOn(Task, 'find').mockResolvedValueOnce([
        { status: 'DONE' },
        { status: 'IN PROGRESS' }
      ]);

      const response = await request(app)
        .delete(`/api/tasks/${mockTask._id}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Task deleted successfully');
      expect(response.body).toHaveProperty('deletedTaskId', mockTask._id.toString());
    });

    it('should handle case when task not found', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      
      // Mock Task.findById to return null
      jest.spyOn(Task, 'findById').mockResolvedValueOnce(null);
      
      await request(app)
        .delete(`/api/tasks/${invalidId}`)
        .expect(404);
    });
  });

  // Get tasks by status
  describe('GET /:projectId/status/:status', () => {
    it('should get tasks with specific status', async () => {
      const status = 'IN PROGRESS';
      const mockTasks = [
        { 
          _id: new mongoose.Types.ObjectId(),
          title: 'Progress Task',
          status: 'IN PROGRESS',
          assignee: [mockUser],
          reporter: mockUser
        }
      ];
      
      // Mock Project.findById
      jest.spyOn(Project, 'findById').mockResolvedValueOnce(mockProject);
      
      // Mock Task.find
      jest.spyOn(Task, 'find').mockImplementationOnce(() => ({
        populate: jest.fn().mockResolvedValue(mockTasks)
      }));

      const response = await request(app)
        .get(`/api/tasks/${mockProject._id}/status/${status}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('status', status);
    });

    it('should return 404 if project not found', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      
      // Mock Project.findById to return null
      jest.spyOn(Project, 'findById').mockResolvedValueOnce(null);
      
      await request(app)
        .get(`/api/tasks/${invalidId}/status/IN PROGRESS`)
        .expect(404);
    });
  });

  // Get status counts
  describe('GET /:projectId/status-counts', () => {
    it('should get counts of tasks by status', async () => {
      // Mock Project.findById
      jest.spyOn(Project, 'findById').mockResolvedValueOnce(mockProject);
      
      // Mock Task.find
      jest.spyOn(Task, 'find').mockResolvedValueOnce([
        { status: 'BACKLOG' },
        { status: 'TO DO' },
        { status: 'IN PROGRESS' },
        { status: 'IN PROGRESS' },
        { status: 'DONE' }
      ]);

      const response = await request(app)
        .get(`/api/tasks/${mockProject._id}/status-counts`)
        .expect(200);

      expect(response.body).toHaveProperty('totalTasks', 5);
      expect(response.body).toHaveProperty('statusCounts');
      expect(response.body.statusCounts).toHaveProperty('BACKLOG', 1);
      expect(response.body.statusCounts).toHaveProperty('IN PROGRESS', 2);
    });

    it('should return 404 if project not found', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      
      // Mock Project.findById to return null
      jest.spyOn(Project, 'findById').mockResolvedValueOnce(null);
      
      await request(app)
        .get(`/api/tasks/${invalidId}/status-counts`)
        .expect(404);
    });
  });
});