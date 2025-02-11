const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');

// Create a task under a project
router.post('/:projectId/tasks', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { title, assignee, reporter, priority } = req.body;

        const project = await Project.findById(projectId);
        
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const newTask = new Task({
            title,
            assignee,
            reporter,
            priority,
            status: "Backlog",
            activityLog: [
                {
                    user: reporter,
                    action: "Task Created",
                    details: { title }
                }
            ]
        });

        project.task.push(newTask);
        await newTask.save();
        await project.save();
        
        res.status(201).json(newTask);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a task under a project
router.put('/:projectId/tasks/:taskId', async (req, res) => {
    try {
        const { projectId, taskId } = req.params;
        const updatedFields = req.body;
        const { userId, actionDescription } = req.body;

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const taskIndex = project.tasks.findIndex(task => task._id.toString() === taskId);
        if (taskIndex === -1) return res.status(404).json({ message: 'Task not found' });

        const updatedTask = {
            ...project.tasks[taskIndex]._doc,
            ...updatedFields,
            activityLog: [
                ...project.tasks[taskIndex].activityLog,
                {
                    user: userId,
                    action: actionDescription || "Task Updated",
                    details: updatedFields
                }
            ]
        };

        project.tasks[taskIndex] = updatedTask;
        project.progress = calculateProgress(project.tasks);
        await project.save();

        res.json(updatedTask);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Assign a member to a task
router.put('/:projectId/tasks/:taskId/assign', async (req, res) => {
    try {
        const { projectId, taskId } = req.params;
        const { assignee, userId } = req.body;

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const taskIndex = project.tasks.findIndex(task => task._id.toString() === taskId);
        if (taskIndex === -1) return res.status(404).json({ message: 'Task not found' });

        project.tasks[taskIndex].assignee = assignee;
        project.tasks[taskIndex].activityLog.push({
            user: userId,
            action: "Assigned Task",
            details: { assignedTo: assignee }
        });

        project.progress = calculateProgress(project.tasks);
        await project.save();

        res.json(project.tasks[taskIndex]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
