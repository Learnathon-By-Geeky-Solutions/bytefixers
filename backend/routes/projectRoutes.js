const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const Subtask = require("../models/Subtask");

// Create a new project
router.post('/create', async (req, res) => {
    try {
        const { name, team, createdBy, description, status } = req.body;

        // Create a new project document
        const project = new Project({
            name,
            team,
            createdBy,
            description,
            status: status || 'Planning'
        });

        await project.save();
        res.status(201).json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all projects
router.get('/', async (req, res) => {
    try {
        // Populate tasks and team members for better context
        const projects = await Project.find()
            .populate('task')  // Populates task details
            //.populate('team')   // Populates team details
            .populate('createdBy', 'name email'); // Populates creator details
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get a project by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id);
        const project = await Project.findById(id)
            .populate('task')
            // .populate('team')
            .populate('createdBy', 'name email');

        if (!project) return res.status(404).json({ message: 'Project not found' });

        res.json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a project
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const project = await Project.findByIdAndUpdate(id, updates, { new: true })
            .populate('task')
            //.populate('team')
            .populate('createdBy', 'name email');

        if (!project) return res.status(404).json({ message: 'Project not found' });

        res.json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a project
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findByIdAndDelete(id);

        if (!project) return res.status(404).json({ message: 'Project not found' });

        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// Route to fetch projects for a user
router.get("/user/:userId/projects", async (req, res) => {
  const { userId } = req.params; // Get the user ID from the route parameter

  try {
    // 1. Fetch projects where the user is the creator (createdBy)
    const createdProjects = await Project.find({ createdBy: userId });

    // 2. Fetch tasks where the user is assigned (task.assignee)
    const tasksAssignedToUser = await Task.find({
      assignee: { $in: [userId] }, // Find tasks where the user is in the assignee array
    });

    // Get the IDs of the tasks the user is assigned to
    const taskIds = tasksAssignedToUser.map((task) => task._id);

    // 3. Fetch subtasks where the user is assigned (subtask.assignee)
    const subtasksAssignedToUser = await Subtask.find({
      assignee: { $in: [userId] }, // Find subtasks where the user is in the assignee array
    });

    // Get the task IDs associated with the subtasks
    const subtaskIds = subtasksAssignedToUser.map((subtask) => subtask._id);

    // 4. Fetch tasks where the subtask IDs are included in the subtask array of the task
    const tasksWithAssignedSubtasks = await Task.find({
      subtask: { $in: subtaskIds }, // Find tasks that have subtasks assigned to the user
    });

    // Get task IDs that have subtasks assigned to the user
    const tasksWithSubtaskAssignedIds = tasksWithAssignedSubtasks.map(
      (task) => task._id
    );

    // 5. Fetch projects where the user is assigned to any task or subtask (using task and subtask IDs)
    const assignedProjects = await Project.find({
      $or: [
        { task: { $in: taskIds } }, // Projects with tasks assigned to the user
        { task: { $in: tasksWithSubtaskAssignedIds } }, // Projects with tasks containing subtasks assigned to the user
      ],
    });

    // Combine both sets of projects and remove duplicates
    const projects = [...createdProjects, ...assignedProjects];

    // Remove duplicates based on project ID
    const uniqueProjects = [...new Map(projects.map((p) => [p._id, p])).values()];

    // If no projects are found, send a 404 response
    if (uniqueProjects.length === 0) {
      return res.status(404).json({ message: "No projects found for this user." });
    }

    // Send the projects in the response
    return res.status(200).json(uniqueProjects);
  } catch (error) {
    // Handle any errors that may occur
    console.error("Error fetching projects:", error);
    return res.status(500).json({ message: "An error occurred while fetching projects." });
  }
});


module.exports = router;
