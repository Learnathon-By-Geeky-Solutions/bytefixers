const express = require('express');
const router = express.Router();
const AIChatbotAssistant = require('../services/aiChatbotService');
const Conversation = require('../models/Conversation');

// Chatbot Conversation Route
router.post('/chat', async (req, res) => { // Changed to POST since we're sending data in body
  try {
    // Extract query and user ID from request
    const { userId, query } = req.body;

    // Validate input
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query is required'
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Process user query
    const aiResponse = await AIChatbotAssistant.processUserQuery(query, userId);

    // Find existing conversation or create new one - only one conversation per user
    let conversation = await Conversation.findOne({ userId });
    
    if (!conversation) {
      // Create a new conversation if one doesn't exist
      conversation = new Conversation({
        userId,
        title: "Chat History",
        messages: []
      });
    }

    // Add user message to conversation
    conversation.messages.push({
      role: 'user',
      content: query
    });

    // Add AI response to conversation
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse
    });

    // Save the conversation
    await conversation.save();

    // Send response
    res.status(200).json({
      success: true,
      message: 'AI Chatbot Response',
      response: aiResponse,
      conversationId: conversation._id
    });
  } catch (error) {
    console.error('Chatbot Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chatbot query',
      error: error.message
    });
  }
});

// Get chat history for a user
router.post('/chat-history', async (req, res) => {
  try {
    const { userId } = req.body; // Get userId from query parameters

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Find the single conversation for this user
    const conversation = await Conversation.findOne({ userId });
    
    if (!conversation) {
      return res.status(200).json({
        success: true,
        message: 'No chat history found',
        history: { messages: [] }
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Chat history retrieved',
      history: conversation
    });
  } catch (error) {
    console.error('Chat History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat history',
      error: error.message
    });
  }
});

// Clear chat history for a user
router.delete('/delete-chat-history', async (req, res) => {
  try {
    const { userId } = req.body; // For security
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const conversation = await Conversation.findOne({ userId });
    
    if (!conversation) {
      return res.status(200).json({
        success: true,
        message: 'No chat history to clear'
      });
    }
    
    // Clear messages but keep the conversation document
    conversation.messages = [];
    await conversation.save();
    
    res.status(200).json({
      success: true,
      message: 'Chat history cleared successfully'
    });
  } catch (error) {
    console.error('Chat History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear chat history',
      error: error.message
    });
  }
});

module.exports = router;