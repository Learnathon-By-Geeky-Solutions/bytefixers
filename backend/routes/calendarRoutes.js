const express = require("express");
const router = express.Router();
const CalendarEvent = require("../models/Calendar");
const Task = require("../models/Task");
const Subtask = require("../models/Subtask");
const Project = require("../models/Project");

// Get all calendar events for a project
router.get("/project/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    // Prepare date range filter if provided
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.startDate = { $gte: new Date(startDate) };
      dateFilter.endDate = { $lte: new Date(endDate) };
    }

    // Fetch calendar events
    const events = await CalendarEvent.find({
      project: projectId,
      ...dateFilter,
    })
      .populate("task", "title status priority")
      .populate("createdBy", "name email")
      .populate("participants", "name email")
      .sort({ startDate: 1 });

    // Fetch tasks with due dates
    const tasks = await Task.find({
      team: projectId,
      dueDate: { $exists: true, $ne: null },
    })
      .select("_id title dueDate status priority assignee reporter")
      .populate("assignee", "name email");

    // Fetch subtasks with due dates
    const subtasks = await Subtask.find({
      parentTask: { $in: await Task.find({ team: projectId }).select("_id") },
      dueDate: { $exists: true, $ne: null },
    })
      .select("_id title dueDate status priority assignee reporter parentTask")
      .populate("assignee", "name email")
      .populate("parentTask", "title");

    // Convert tasks and subtasks to calendar events format
    const taskEvents = tasks.map((task) => ({
      _id: `task-${task._id}`,
      title: `📋 ${task.title} (Due)`,
      startDate: task.dueDate,
      endDate: task.dueDate, // Same day for task due dates
      eventType: "TASK_DUE",
      priority: task.priority,
      status: task.status === "DONE" ? "COMPLETED" : "SCHEDULED",
      task: task._id,
      project: projectId,
      createdBy: task.reporter,
      participants: task.assignee ? [task.assignee._id] : [],
    }));

    const subtaskEvents = subtasks.map((subtask) => ({
      _id: `subtask-${subtask._id}`,
      title: `📌 ${subtask.parentTask.title} > ${subtask.title} (Due)`,
      startDate: subtask.dueDate,
      endDate: subtask.dueDate, // Same day for subtask due dates
      eventType: "TASK_DUE",
      priority: subtask.priority,
      status: subtask.status === "DONE" ? "COMPLETED" : "SCHEDULED",
      task: subtask.parentTask._id,
      project: projectId,
      createdBy: subtask.reporter,
      participants: subtask.assignee ? [subtask.assignee._id] : [],
    }));

    // Combine all events
    const allEvents = [...events, ...taskEvents, ...subtaskEvents];

    res.json(allEvents);
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get a specific calendar event
router.get("/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Extract handling of special IDs
    if (isSpecialId(eventId)) {
      return await handleSpecialIdEvent(eventId, res);
    }

    // Handle regular calendar event
    return await handleRegularCalendarEvent(eventId, res);

  } catch (error) {
    handleErrorResponse(error, res);
  }
});

// Helper function to check if ID is special
function isSpecialId(eventId) {
  return eventId.startsWith("task-") || eventId.startsWith("subtask-");
}

// Handle task and subtask events
async function handleSpecialIdEvent(eventId, res) {
  const [type, realId] = eventId.split('-');
  
  const event = type === 'task' 
    ? await fetchTaskEvent(realId) 
    : await fetchSubtaskEvent(realId);
  
  if (!event) {
    return res.status(404).json({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} not found` });
  }

  return res.json(event);
}

// Fetch and transform task event
async function fetchTaskEvent(realId) {
  const task = await Task.findById(realId)
    .populate("assignee", "name email")
    .populate("reporter", "name email");

  if (!task) return null;

  return {
    _id: `task-${realId}`,
    title: task.title,
    startDate: task.dueDate,
    endDate: task.dueDate,
    eventType: "TASK_DUE",
    priority: task.priority,
    status: task.status === "DONE" ? "COMPLETED" : "SCHEDULED",
    task: task._id,
    project: task.team,
    createdBy: task.reporter,
    participants: task.assignee ? [task.assignee] : [],
  };
}

// Fetch and transform subtask event
async function fetchSubtaskEvent(realId) {
  const subtask = await Subtask.findById(realId)
    .populate("assignee", "name email")
    .populate("reporter", "name email")
    .populate("parentTask", "title");

  if (!subtask) return null;

  return {
    _id: `subtask-${realId}`,
    title: `${subtask.parentTask.title} > ${subtask.title}`,
    startDate: subtask.dueDate,
    endDate: subtask.dueDate,
    eventType: "TASK_DUE",
    priority: subtask.priority,
    status: subtask.status === "DONE" ? "COMPLETED" : "SCHEDULED",
    task: subtask.parentTask._id,
    project: subtask.team,
    createdBy: subtask.reporter,
    participants: subtask.assignee ? [subtask.assignee] : [],
  };
}

// Handle regular calendar event
async function handleRegularCalendarEvent(eventId, res) {
  const event = await CalendarEvent.findById(eventId)
    .populate("task", "title status priority")
    .populate("createdBy", "name email")
    .populate("participants", "name email");

  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }

  return res.json(event);
}

// Error handling
function handleErrorResponse(error, res) {
  console.error("Error fetching calendar event:", error);
  res.status(500).json({ message: error.message });
}

// Create new calendar event
router.post("/", async (req, res) => {
  try {
    const event = new CalendarEvent(req.body);
    
    await event.save();

    const populatedEvent = await CalendarEvent.findById(event._id)
      .populate("task", "title status priority")
      .populate("createdBy", "name email")
      .populate("participants", "name email");

    res.status(201).json(populatedEvent);
  } catch (error) {
    console.error("Error creating calendar event:", error);
    res.status(400).json({ message: error.message });
  }
});

// Update calendar event
router.put("/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if it's a special event (task/subtask due date)
    if (eventId.startsWith("task-")) {
      const taskId = eventId.split("-")[1];
      const task = await Task.findById(taskId);

      if (!task) return res.status(404).json({ message: "Task not found" });

      task.dueDate = req.body.startDate;
      await task.save();

      return res.json({
        _id: eventId,
        title: task.title,
        startDate: task.dueDate,
        endDate: task.dueDate,
        eventType: "TASK_DUE",
        priority: task.priority,
        status: task.status === "DONE" ? "COMPLETED" : "SCHEDULED",
        task: task._id,
      });
    } else if (eventId.startsWith("subtask-")) {
      const subtaskId = eventId.split("-")[1];
      const subtask = await Subtask.findById(subtaskId);

      if (!subtask)
        return res.status(404).json({ message: "Subtask not found" });

      subtask.dueDate = req.body.startDate;
      await subtask.save();

      return res.json({
        _id: eventId,
        title: subtask.title,
        startDate: subtask.dueDate,
        endDate: subtask.dueDate,
        eventType: "TASK_DUE",
      });
    }

    // Regular calendar event
    const event = await CalendarEvent.findByIdAndUpdate(eventId, req.body, {
      new: true,
    })
      .populate("task", "title status priority")
      .populate("createdBy", "name email")
      .populate("participants", "name email");

    if (!event) return res.status(404).json({ message: "Event not found" });

    res.json(event);
  } catch (error) {
    console.error("Error updating calendar event:", error);
    res.status(400).json({ message: error.message });
  }
});

// Delete calendar event
router.delete("/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if it's a special ID for task or subtask
    if (eventId.startsWith("task-") || eventId.startsWith("subtask-")) {
      return res.status(400).json({
        message:
          "Cannot delete task due dates directly. Please update the task instead.",
      });
    }

    const result = await CalendarEvent.findByIdAndDelete(eventId);

    if (!result) return res.status(404).json({ message: "Event not found" });

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
