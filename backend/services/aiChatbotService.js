const axios = require('axios');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Team = require('../models/Team');

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

      console.log(normalizedQuery);
      // Identify query type and route accordingly
      if (this.isTaskRelatedQuery(normalizedQuery)) {
        return await this.handleTaskQuery(normalizedQuery, userId);
      }
      console.log(normalizedQuery);
      if (this.isProjectRelatedQuery(normalizedQuery)) {
        return await this.handleProjectQuery(normalizedQuery, userId);
      }
      console.log(normalizedQuery);
      if (this.isTeamRelatedQuery(normalizedQuery)) {
        return await this.handleTeamQuery(normalizedQuery, userId);
      }
      console.log(normalizedQuery);
      // Generic AI response for unclassified queries
      return await this.generateGenericResponse(query, userId);
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
      // Fetch user's tasks
      const pendingTasks = await Task.find({
        assignee: userId,
        status: { $in: ['BACKLOG', 'TO DO', 'IN PROGRESS', 'REVIEW'] }
      })
      .populate('reporter')
      .sort({ priority: -1, dueDate: 1 });

      const summary = this.summarizeTasks(pendingTasks);
      // Prepare context for AI
      const taskDetails = summary.tasks.map(task => 
        `- ${task.title} (${task.priority} Priority, ${task.status} Status)${task.dueDate ? ` - Due: ${task.dueDate.toLocaleDateString()}` : ''}`
      ).join('\n');

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
      const projects = await Project.find({ members: userId }).populate('task');;
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
      // Find teams user is part of
      const teams = await Team.find({ 
        members: userId 
      }).populate({
        path: 'members',
        populate: {
          path: 'tasks',
          match: { 
            status: { $in: ['IN PROGRESS', 'REVIEW'] } 
          }
        }
      });

      // Prepare team context
      const teamContext = teams.map(team => 
        `Team: ${team.name}
        - Total Members: ${team.members.length}
        - Active Tasks: ${team.members.reduce((sum, member) => sum + (member.tasks || []).length, 0)}`
      ).join('\n\n');

      // Generate AI-powered response
      const prompt = `Context: User's Team Information
      ${teamContext}

      User Query: ${query}

      Provide an insightful response addressing:
      1. Team collaboration
      2. Workload distribution
      3. Performance insights
      answer these briefly and break down the information into a list of points.`;

      return await this.geminiRequest(prompt);
    } catch (error) {
      console.error('Team query handling error:', error);
      return "I couldn't retrieve specific team details. Could you provide more context?";
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
      if (response.data && 
          response.data.candidates && 
          response.data.candidates[0] && 
          response.data.candidates[0].content && 
          response.data.candidates[0].content.parts) {
        return response.data.candidates[0].content.parts[0].text.trim();
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