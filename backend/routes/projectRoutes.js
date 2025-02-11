const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

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
            .populate('tasks')  // Populates task details
            .populate('team')   // Populates team details
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

        const project = await Project.findById(id)
            .populate('tasks')
            .populate('team')
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
            .populate('tasks')
            .populate('team')
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

module.exports = router;
