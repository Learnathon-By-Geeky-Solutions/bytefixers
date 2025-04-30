const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const chatRoutes = require('../routes/chatRoutes');
const Conversation = require('../models/Conversation');
const AIChatbotAssistant = require('../services/aiChatbotService');

// Mock the AI service
jest.mock('../services/aiChatbotService', () => ({
  processUserQuery: jest.fn()
}));

describe('Chat Routes Tests', () => {
  let mongoServer;
  let app;
  const userId = new mongoose.Types.ObjectId();
  const conversationId = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    // Set up MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Set up express app
    app = express();
    app.use(express.json());
    app.use('/api/chatbot', chatRoutes);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear collections
    await Conversation.deleteMany({});
    
    // Reset mock
    jest.clearAllMocks();
  });

  describe('POST /chat', () => {
    test('should create a new conversation when none exists', async () => {
      // Mock AI response
      AIChatbotAssistant.processUserQuery.mockResolvedValue('This is a test AI response');

      const response = await request(app)
        .post('/api/chatbot/chat')
        .send({
          userId: userId.toString(),
          query: 'Test question'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.response).toBe('This is a test AI response');
      expect(response.body.conversationId).toBeDefined();

      // Verify that conversation was created
      const conversations = await Conversation.find({ userId: userId.toString() });
      expect(conversations).toHaveLength(1);
      expect(conversations[0].messages).toHaveLength(2);
      expect(conversations[0].messages[0].content).toBe('Test question');
      expect(conversations[0].messages[1].content).toBe('This is a test AI response');
    });

    test('should add to existing conversation when one exists', async () => {
      // Create an existing conversation
      const existingConversation = new Conversation({
        _id: conversationId,
        userId: userId.toString(),
        title: 'Chat History',
        messages: [
          { role: 'user', content: 'Previous question' },
          { role: 'assistant', content: 'Previous answer' }
        ]
      });
      await existingConversation.save();

      // Mock AI response
      AIChatbotAssistant.processUserQuery.mockResolvedValue('New AI response');

      const response = await request(app)
        .post('/api/chatbot/chat')
        .send({
          userId: userId.toString(),
          query: 'Follow-up question'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.response).toBe('New AI response');

      // Verify that messages were added to existing conversation
      const conversation = await Conversation.findById(conversationId);
      expect(conversation.messages).toHaveLength(4);
      expect(conversation.messages[2].content).toBe('Follow-up question');
      expect(conversation.messages[3].content).toBe('New AI response');
    });

    test('should return 400 if query is missing', async () => {
      const response = await request(app)
        .post('/api/chatbot/chat')
        .send({
          userId: userId.toString()
          // Missing query parameter
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Query is required');
    });

    test('should return 400 if userId is missing', async () => {
      const response = await request(app)
        .post('/api/chatbot/chat')
        .send({
          query: 'Test question'
          // Missing userId parameter
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User ID is required');
    });

    test('should handle AI service errors', async () => {
      // Mock AI service to throw an error
      AIChatbotAssistant.processUserQuery.mockRejectedValue(new Error('AI service failed'));

      const response = await request(app)
        .post('/api/chatbot/chat')
        .send({
          userId: userId.toString(),
          query: 'Test question'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to process chatbot query');
      expect(response.body.error).toBe('AI service failed');
    });
  });

  describe('POST /chat-history', () => {
    test('should return conversation history when it exists', async () => {
      // Create an existing conversation
      const existingConversation = new Conversation({
        _id: conversationId,
        userId: userId.toString(),
        title: 'Chat History',
        messages: [
          { role: 'user', content: 'Test question' },
          { role: 'assistant', content: 'Test answer' }
        ]
      });
      await existingConversation.save();

      const response = await request(app)
        .post('/api/chatbot/chat-history')
        .send({
          userId: userId.toString()
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.history).toBeDefined();
      expect(response.body.history.messages).toHaveLength(2);
      expect(response.body.history.messages[0].content).toBe('Test question');
      expect(response.body.history.messages[1].content).toBe('Test answer');
    });

    test('should return empty history when no conversation exists', async () => {
      const response = await request(app)
        .post('/api/chatbot/chat-history')
        .send({
          userId: userId.toString()
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('No chat history found');
      expect(response.body.history.messages).toEqual([]);
    });

    test('should return 400 if userId is missing', async () => {
      const response = await request(app)
        .post('/api/chatbot/chat-history')
        .send({
          // Missing userId parameter
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User ID is required');
    });
  });

  describe('DELETE /delete-chat-history', () => {
    test('should clear conversation history when it exists', async () => {
      // Create an existing conversation
      const existingConversation = new Conversation({
        _id: conversationId,
        userId: userId.toString(),
        title: 'Chat History',
        messages: [
          { role: 'user', content: 'Test question' },
          { role: 'assistant', content: 'Test answer' }
        ]
      });
      await existingConversation.save();

      const response = await request(app)
        .delete('/api/chatbot/delete-chat-history')
        .send({
          userId: userId.toString()
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Chat history cleared successfully');

      // Verify that messages were cleared
      const conversation = await Conversation.findById(conversationId);
      expect(conversation).toBeDefined();
      expect(conversation.messages).toHaveLength(0);
    });

    test('should return success message when no conversation exists', async () => {
      const response = await request(app)
        .delete('/api/chatbot/delete-chat-history')
        .send({
          userId: userId.toString()
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('No chat history to clear');
    });

    test('should return 400 if userId is missing', async () => {
      const response = await request(app)
        .delete('/api/chatbot/delete-chat-history')
        .send({
          // Missing userId parameter
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User ID is required');
    });
  });
});