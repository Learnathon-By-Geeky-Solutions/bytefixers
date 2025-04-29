const axios = require('axios');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Team = require('../models/Team');
const mongoose = require('mongoose');

class AIChatbotAssistant {
  constructor() {
    // Configure Gemini API settings
    this.geminiApiKey = process.env.GEMINI_API_KEY; 
    this.geminiApiUrl = 'https://generativelanguage.googleapis.com/v1';
    this.defaultModel = 'gemini-1.5-pro'; // Using Gemini 1.5 Pro as default
  }

  // Main chat processing method
  async processUserQuery(query, userId) {
    try {
      // Normalize query
      const normalizedQuery = query.toLowerCase().trim();
      const sanitizedUserId = userId.toString();
      // Identify query type and route accordingly
      if (this.isTaskRelatedQuery(normalizedQuery)) {
        return await this.handleTaskQuery(normalizedQuery, sanitizedUserId);
      }
      if (this.isProjectRelatedQuery(normalizedQuery)) {
        return await this.handleProjectQuery(normalizedQuery, sanitizedUserId);
      }
      if (this.isTeamRelatedQuery(normalizedQuery)) {
        return await this.handleTeamQuery(normalizedQuery, sanitizedUserId);
      }
      // Generic AI response for unclassified queries
      return await this.generateGenericResponse(normalizedQuery, sanitizedUserId);
    } catch (error) {
      console.error('Chatbot processing error:', error);
      return this.getFallbackResponse();
    }
  }

  // Query Classification Methods
  isTaskRelatedQuery(query) {
    const taskKeywords = [
      'task', 'tasks', 'todo', 'to-do', 'pending', 
      'assignment', 'workload', 'priority', 'deadline', 'status'
    ];
    return taskKeywords.some(keyword => query.includes(keyword));
  }

  isProjectRelatedQuery(query) {
    const projectKeywords = [
      'project', 'projects', 'milestone', 'progress', 
      'timeline', 'roadmap', 'completion'
    ];
    return projectKeywords.some(keyword => query.includes(keyword));
  }

  isTeamRelatedQuery(query) {
    const teamKeywords = [
      'team', 'teammate', 'colleague', 'workgroup', 
      'collaboration', 'team performance'
    ];
    return teamKeywords.some(keyword => query.includes(keyword));
  }

  // Specialized Query Handlers
  async handleTaskQuery(query, userId) {
    try {
      const sanitizedUserId = userId.toString();
      // Fetch user's tasks
      const pendingTasks = await Task.find({
        assignee: sanitizedUserId,
        status: { $in: ['BACKLOG', 'TO DO', 'IN PROGRESS', 'REVIEW'] }
      })
      .populate('reporter')
      .sort({ priority: -1, dueDate: 1 });

      const summary = this.summarizeTasks(pendingTasks);
      // Prepare context for AI
      const taskDetails = summary.tasks.map(task => {
        let baseDetails = `- ${task.title} (${task.priority} Priority, ${task.status} Status)`;
        
        if (task.dueDate) {
          baseDetails += ` - Due: ${task.dueDate.toLocaleDateString()}`;
        }
        
        return baseDetails;
      }).join('\n');

      // Generate AI-powered response
      const prompt = `${query}

      Task Summary:
      - Total Pending Tasks: ${summary.totalPendingTasks}

      Task Breakdown by Priority:
      * Low Priority: ${summary.priorityCount.LOW}
      * Medium Priority: ${summary.priorityCount.MEDIUM}
      * High Priority: ${summary.priorityCount.HIGH}
      * Critical Tasks: ${summary.priorityCount.CRITICAL}

      Task Status:
      * Backlog: ${summary.statusCount.BACKLOG}
      * To Do: ${summary.statusCount['TO DO']}
      * In Progress: ${summary.statusCount['IN PROGRESS']}
      * In Review: ${summary.statusCount.REVIEW}

      Specific Tasks:
      ${taskDetails}

      Provide a helpful, professional response that:
      1. Addresses the query directly
      2. Offers practical advice
      Explain these concisely and Break down the information into a list of points.
      `;

      return await this.geminiRequest(prompt);
    } catch (error) {
      console.error('Task query handling error:', error);
      return "I couldn't retrieve specific task details. Could you provide more context?";
    }
  }

  // Task Summarization Helper
  summarizeTasks(tasks) {
    const priorityCount = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0
    };

    const statusCount = {
      BACKLOG: 0,
      'TO DO': 0,
      'IN PROGRESS': 0,
      REVIEW: 0
    };

    tasks.forEach(task => {
      priorityCount[task.priority]++;
      statusCount[task.status]++;
    });

    return {
      totalPendingTasks: tasks.length,
      priorityCount,
      statusCount,
      oldestTask: tasks[0] || null,
      criticalTasks: tasks.filter(task => task.priority === 'CRITICAL'),
      tasks: tasks
    };
  }

  async handleProjectQuery(query, userId) {
    try {
      const sanitizedUserId = userId.toString();
      const projects = await Project.find({ members: sanitizedUserId }).populate('task');;
      // Prepare project context
      const projectContext = projects.map(project => 
        `Project: ${project.name}
        - Total Tasks: ${project.task.length}
        - Completed Tasks: ${project.task.filter(t => t.status === 'DONE').length}
        - In Progress: ${project.task.filter(t => t.status === 'IN PROGRESS').length}`
      ).join('\n\n');

      // Generate AI-powered response
      const prompt = `Context: User's Projects
      ${projectContext}

      User Query: ${query}

      Provide a helpful, professional response that:
      1. Addresses the query directly
      2. Project status and progress

      Explain these concisely and break down the information into a list of points.`;

      return await this.geminiRequest(prompt);
    } catch (error) {
      console.error('Project query handling error:', error);
      return "I couldn't retrieve specific project details. Could you provide more context?";
    }
  }

  async handleTeamQuery(query, userId) {
    try {
      const sanitizedUserId = userId.toString();
  
      // Just fetch the teams where the user is a member
      const teams = await Team.find({
        teamMember: sanitizedUserId
      }).populate('teamMember').populate('leader');
  
      if (!teams || teams.length === 0) {
        return "You're not currently part of any teams.";
      }
  
      // Send entire teams data to geminiRequest
      const prompt = `The user asked: "${query}"
      Here is the user's team data: ${JSON.stringify(teams, null, 2)}

      Provide an insightful response addressing Team collaboration
      Give a brief and structured answer based on the query.`;
  
      return await this.geminiRequest(prompt);
    } catch (error) {
      console.error('Team query handling error:', error);
      return "Couldn't retrieve team data. Please try again.";
    }
  }
  

  // Generic AI Response for Unclassified Queries
  async generateGenericResponse(query, userId) {
    const prompt = `User Query: ${query}

    Provide a helpful, professional response that:
    1. Addresses the query directly
    2. Offers practical advice
    3. Relates to project management if possible

    Explain these concisely and break down the information into a list of points.`;

    return await this.geminiRequest(prompt);
  }

  // Gemini API Request Helper
  async geminiRequest(prompt, model = this.defaultModel) {
    try {
      const url = `${this.geminiApiUrl}/models/${model}:generateContent?key=${this.geminiApiKey}`;
      
      console.log(`Requesting from Gemini API URL: ${this.geminiApiUrl}/models/${model}:generateContent`);
      
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 400,
          topP: 0.95,
          topK: 40
        }
      };
      
      const response = await axios.post(url, requestBody);
      
      console.log('Response status:', response.status);
      
      // Extract text from the first candidate's content parts
      const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (responseText) {
        return responseText.trim();
      }
      
      console.log('No valid response content found');
      return this.getFallbackResponse();
    } catch (error) {
      console.error('Gemini API request error:', error.message);
      // More detailed logging
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
      return this.getFallbackResponse();
    }
  }

  // Fallback Response
  getFallbackResponse() {
    return `I apologize, but I'm unable to generate a specific response right now. 
    Could you rephrase your question or provide more context? 
    I'm here to help you with tasks, projects, and team-related insights.`;
  }
}

module.exports = new AIChatbotAssistant();