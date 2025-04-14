const express = require("express");
const router = express.Router();
const Project = require("../models/Project");

// Create a new project
router.post("/create", async (req, res) => {
  try {
    const { name, team, createdBy, description, status } = req.body;

    // Create a new project document
    const project = new Project({
      name,
      team,
      createdBy,
      description,
      status: status || "Planning",
    });
    project.members.push(createdBy);
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all projects
router.get("/", async (req, res) => {
  try {
    // Populate tasks and team members for better context
    const projects = await Project.find()
      .populate("task") // Populates task details
      //.populate('team')   // Populates team details
      .populate("createdBy", "name email"); // Populates creator details
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a project by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    const project = await Project.findById(id)
      .populate("task")
      // .populate('team')
      .populate("createdBy", "name email");

    if (!project) return res.status(404).json({ message: "Project not found" });

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a project
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const project = await Project.findByIdAndUpdate(id, updates, { new: true })
      .populate("task")
      //.populate('team')
      .populate("createdBy", "name email");

    if (!project) return res.status(404).json({ message: "Project not found" });

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a project
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndDelete(id);

    if (!project) return res.status(404).json({ message: "Project not found" });

    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// get all tasks under a project
router.get("/:projectId/tasks", async (req, res) => {
  try {
    const { projectId } = req.params;

    // Find all tasks related to the project
    const project = await Project.findById(projectId).populate({
      path: "task",
      populate: [
        {
          path: "subTask",
          populate: [
            { path: "assignee", select: "name email" },
            { path: "reporter", select: "name email" },
            { path: "createdBy", select: "name email" },
            { path: "parentTask", select: "title" },
            { path: "title", select: "title" },
            { path: "description", select: "description" },
            { path: "status", select: "status" },
            { path: "priority", select: "priority" },
            { path: "dueDate", select: "dueDate" },
          ],
        },
        { path: "assignee", select: "name email" },
        { path: "reporter", select: "name email" },
        { path: "team", select: "name" },
        { path: "title", select: "title" },
        { path: "description", select: "description" },
        { path: "status", select: "status" },
        { path: "priority", select: "priority" },
        { path: "dueDate", select: "dueDate" },
      ],
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    console.log(project.task);
    res.json({ tasks: project.task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//get all projects for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const projects = await Project.find({ members: userId });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: "Error fetching projects", error });
  }
});

router.post("/addUserToProject", async (req, res) => {
  try {
    const { userId, projectId } = req.body;

    if (!userId || !projectId) {
      return res
        .status(400)
        .json({ message: "User ID and Project ID are required" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is already in the project
    if (project.members.includes(userId)) {
      return res
        .status(400)
        .json({ message: "User is already a member of this project" });
    }

    // Add user to the project members
    project.members.push(userId);
    await project.save();

    res.status(200).json({ message: "User added to project", project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
