const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const Subtask = require('../models/Subtask');


// Create a task under a project
router.post('/:projectId/addTasks', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { title,description, assignee, reporter, priority } = req.body;

        const project = await Project.findById(projectId);
        
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const newTask = new Task({
            title,
            description,
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

        const tasks = await Task.find({ _id: { $in: project.task } }, "status");
        const completedTasks = tasks.filter(task => task.status === "Done").length;
        project.progress = Math.round((completedTasks / tasks.length) * 100);

        await project.save();
        
        res.status(201).json(newTask);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a task under a project
router.put('/:projectId/tasks/:taskId/update', async (req, res) => {
    try {
        const { projectId, taskId } = req.params;
        const updatedFields = req.body;
        const { userId, actionDescription } = req.body;

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });

       // Find the task by ID
       const task = await Task.findById(taskId);
       if (!task) return res.status(404).json({ message: 'Task not found' });

       // Update the task with new fields
       Object.assign(task, updatedFields);

       // Add activity log to task
       task.activityLog.push({
           user: userId,
           action: actionDescription || "Task Updated",
           details: updatedFields
       });
        await task.save();
        const tasks = await Task.find({ _id: { $in: project.task } }, "status");
        const completedTasks = tasks.filter(task => task.status === "Done").length;
        project.progress = Math.round((completedTasks / tasks.length) * 100);

        await project.save();
        res.json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Assign a member to a task
router.put('/:projectId/tasks/:taskId/assign', async (req, res) => {
    try {
        const { taskId } = req.params;
        const { assignee, userId } = req.body;

        const task = await Task.findById(taskId);

        // Ensure assignee is an array before pushing
        if (!Array.isArray(task.assignee)) {
            task.assignee = [];
        }

        if (!task.assignee.includes(assignee)) {
            task.assignee.push(assignee);
        }
        task.activityLog.push({
            user: userId,
            action: "Assigned Task",
            details: { assignedTo: assignee }
        });
        await task.save();
        res.json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/:taskId/add-subtask", async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title,description, assignee, reporter, status, priority,userId } = req.body;
    
        // Check if the parent task exists
        const parentTask = await Task.findById(taskId);
        if (!parentTask) {
            return res.status(404).json({ message: "Parent task not found" });
        }
    
        // Create the new subtask
        const subTask = new Subtask({
            title,
            description,
            assignee,
            reporter,
            status: status || "Backlog",
            priority: priority || "Medium",
        });
    
        // Save subtask to database
        await subTask.save(); 
    
        // Add subtask to the parent's subTask array
        parentTask.subTask.push(subTask._id);
        parentTask.activityLog.push({
            user: userId,
            action: "Subtask Created",
            details: { subtask : title }
        });
        await parentTask.save();
    
        return res.status(201).json({ 
            message: "Subtask created and added successfully", 
            subTask, 
            parentTask 
        });
  
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error", err });
    }
});
  

module.exports = router;
