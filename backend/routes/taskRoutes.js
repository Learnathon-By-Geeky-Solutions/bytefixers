const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const Task = require("../models/Task");
const Subtask = require("../models/Subtask");

// Create a task under a project
router.post("/:projectId/addTasks", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignee, reporter, priority, status } =
      req.body;

    const project = await Project.findById(projectId);

    if (!project) return res.status(404).json({ message: "Project not found" });

    const newTask = new Task({
      title,
      description,
      assignee,
      reporter,
      dueDate: new Date(),
      priority: priority || "MEDIUM",
      status: status || "BACKLOG",
      activityLog: [
        {
          user: reporter,
          action: "Task Created",
          details: { title },
        },
      ],
    });

    project.task.push(newTask);
    await newTask.save();

    if (newTask.status === "DONE") {
      newTask.completedAt = new Date();
    } else if (newTask.status !== "DONE") {
      newTask.completedAt = null; // Reset if moving back from DONE
    }
    const tasks = await Task.find({ _id: { $in: project.task } }, "status");
    const completedTasks = tasks.filter(
      (task) => task.status === "DONE"
    ).length;
    project.progress = Math.round((completedTasks / tasks.length) * 100);

    await project.save();

    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a task under a project
router.put("/:projectId/tasks/:taskId/update", async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const updatedFields = req.body;
    const { userId, actionDescription } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Find the task by ID
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Update the task with new fields
    Object.assign(task, updatedFields);

    // Add activity log to task
    task.activityLog.push({
      user: userId,
      action: actionDescription || "Task Updated",
      details: updatedFields,
    });
    await task.save();
    const tasks = await Task.find({ _id: { $in: project.task } }, "status");
    const completedTasks = tasks.filter(
      (task) => task.status === "DONE"
    ).length;
    project.progress = Math.round((completedTasks / tasks.length) * 100);

    await project.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign a member to a task
router.put("/:projectId/tasks/:taskId/assign", async (req, res) => {
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
      details: { assignedTo: assignee },
    });
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//get a task by id
router.get("/task/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId)
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("team", "name")
      .populate("attachments.uploadedBy", "name email")
      .populate("dueDate", "dueDate")
      .populate({
        path: "subTask", // Changed from subtasks to subTask to match your schema
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
      });
    const subtasks = await Subtask.find({
      _id: { $in: task.subTask },
    })
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("createdBy", "name email")
      .populate("parentTask", "title")
      .populate("title", "title")
      .populate("description", "description")
      .populate("status", "status")
      .populate("priority", "priority")
      .populate("dueDate", "dueDate");
    task.subTask = subtasks;
    console.log(task);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/:taskId/add-subtask", async (req, res) => {
  try {
    const { taskId } = req.params;
    const {
      title,
      description,
      status,
      assignee,
      dueDate,
      userId,
      reporter,
      priority,
    } = req.body;

    // Find the parent task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Create the subtask
    const subtask = new Subtask({
      title,
      description,
      status: status || "TO DO",
      priority: priority || "LOW",
      reporter: reporter || userId,
      parentTask: taskId,
      assignee,
      dueDate,
      createdBy: userId,
    });

    // Save the subtask
    const savedSubtask = await subtask.save();

    // Add the subtask to the parent task
    task.subTask.push(savedSubtask._id);

    // Add to activity log
    task.activityLog.push({
      user: userId,
      action: "Added Subtask",
      details: {
        subtaskId: savedSubtask._id,
        subtaskTitle: title,
      },
      timestamp: new Date(),
    });

    await task.save();

    // Return the saved subtask with populated fields
    const populatedSubtask = await Subtask.findById(savedSubtask._id)
      .populate("assignee", "name email")
      .populate("createdBy", "name email")
      .populate("reporter", "name email");

    res.status(201).json(populatedSubtask);
  } catch (error) {
    console.error("Error creating subtask:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
// ✅ Get all subtasks under a task
router.get("/:taskId/subtasks", async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId)
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .populate("team", "name")
      .populate("dueDate", "dueDate")
      .populate({
        path: "subtasks",
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
      })
      .populate("attachments.uploadedBy", "name email")
      .populate({
        path: "activityLog.user",
        select: "name email",
      });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update a subtask
router.put("/subtask/:subtaskId", async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const { 
      title, description, status, priority, 
      reporter, assignee, dueDate, userId 
    } = req.body;

    // Find the subtask
    const subtask = await Subtask.findById(subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: "Subtask not found" });
    }

    // Create a map of old values for comparison
    const oldValues = {
      status: subtask.status,
      assignee: subtask.assignee,
      priority: subtask.priority,
      reporter: subtask.reporter,
      dueDate: subtask.dueDate,
      title: subtask.title,
      description: subtask.description
    };

    // Handle completion time based on status
    if (status === "DONE" && subtask.status !== "DONE") {
      subtask.completedAt = new Date();
    } else if (status !== "DONE" && status) {
      subtask.completedAt = null;
    }

    // Update subtask fields
    updateSubtaskFields(subtask, req.body);
    
    // Track and generate changes
    const changes = trackChanges(oldValues, subtask, req.body);
    
    // Add activity log if there are changes
    if (changes.length > 0) {
      addActivityLog(subtask, userId, changes);
      
      // Update parent task's activity log
      await updateParentTaskLog(subtask, userId, changes);
    }

    // Save the updated subtask
    const updatedSubtask = await subtask.save();
    
    // Return populated subtask
    const populatedSubtask = await populateSubtask(updatedSubtask._id);
    
    res.status(200).json(populatedSubtask);
  } catch (error) {
    console.error("Error updating subtask:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Helper functions
function updateSubtaskFields(subtask, updates) {
  const { title, description, status, assignee, dueDate, priority, reporter } = updates;
  
  subtask.title = title || subtask.title;
  subtask.description = description !== undefined ? description : subtask.description;
  subtask.status = status || subtask.status;
  subtask.assignee = assignee !== undefined ? assignee : subtask.assignee;
  subtask.dueDate = dueDate !== undefined ? dueDate : subtask.dueDate;
  subtask.priority = priority || subtask.priority;
  subtask.reporter = reporter || subtask.reporter;
}

function trackChanges(oldValues, subtask, updates) {
  const changes = [];
  const { title, description, status, assignee, dueDate, priority, reporter } = updates;
  
  if (status && status !== oldValues.status) {
    changes.push(`Status changed from ${oldValues.status} to ${status}`);
  }
  if (assignee !== undefined && assignee !== oldValues.assignee) {
    changes.push(`Assignee ${assignee ? "updated" : "removed"}`);
  }
  if (priority && priority !== oldValues.priority) {
    changes.push(`Priority changed from ${oldValues.priority} to ${priority}`);
  }
  if (reporter && reporter !== oldValues.reporter) {
    changes.push(`Reporter changed`);
  }
  if (dueDate !== undefined && dueDate !== oldValues.dueDate) {
    changes.push(`Due date ${dueDate ? "updated" : "removed"}`);
  }
  if (title && title !== oldValues.title) {
    changes.push(`Title updated from "${oldValues.title}" to "${title}"`);
  }
  if (description !== undefined && description !== oldValues.description) {
    changes.push(`Description updated`);
  }
  
  return changes;
}

function addActivityLog(subtask, userId, changes) {
  const changeMessage = changes.join(", ");
  
  subtask.activityLog.push({
    user: userId,
    action: changeMessage,
    details: createChangeDetails(subtask),
    timestamp: new Date()
  });
}

function createChangeDetails(subtask) {
  const { title, status, assignee, priority, reporter, dueDate, _id } = subtask;
  
  return {
    subtaskId: _id,
    subtaskTitle: title,
    changes: {
      status: status !== subtask.status ? { from: subtask.status, to: status } : undefined,
      assignee: assignee !== subtask.assignee ? { from: subtask.assignee, to: assignee } : undefined,
      priority: priority !== subtask.priority ? { from: subtask.priority, to: priority } : undefined,
      reporter: reporter !== subtask.reporter ? { from: subtask.reporter, to: reporter } : undefined,
      dueDate: dueDate !== subtask.dueDate ? { from: subtask.dueDate, to: dueDate } : undefined,
    }
  };
}

async function updateParentTaskLog(subtask, userId, changes) {
  const task = await Task.findById(subtask.parentTask);
  if (!task) return;
  
  const changeMessage = changes.join(", ");
  
  task.activityLog.push({
    user: userId,
    action: `Subtask "${subtask.title}": ${changeMessage}`,
    details: createChangeDetails(subtask),
    timestamp: new Date()
  });
  
  await task.save();
}

async function populateSubtask(subtaskId) {
  return await Subtask.findById(subtaskId)
    .populate("assignee", "name email")
    .populate("createdBy", "name email")
    .populate("reporter", "name email")
    .populate("parentTask", "title")
    .populate("title", "title")
    .populate("description", "description")
    .populate("status", "status")
    .populate("priority", "priority")
    .populate("dueDate", "dueDate");
}


// Delete a subtask
router.delete("/subtask/:subtaskId", async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const { userId } = req.body;

    // Find the subtask
    const subtask = await Subtask.findById(subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: "Subtask not found" });
    }

    // Store the parent task ID before deletion
    const taskId = subtask.parentTask;

    // Delete the subtask
    await Subtask.findByIdAndDelete(subtaskId);

    // Remove the subtask reference from the parent task
    const task = await Task.findById(taskId);
    if (task) {
      task.subTask = task.subTask.filter((id) => id.toString() !== subtaskId);

      // Add to activity log
      task.activityLog.push({
        user: userId,
        action: "Deleted Subtask",
        details: {
          subtaskTitle: subtask.title,
        },
        timestamp: new Date(),
      });

      await task.save();
    }

    res
      .status(200)
      .json({ message: "Subtask deleted successfully", subtaskId });
  } catch (error) {
    console.error("Error deleting subtask:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
// Get all tasks for a specific project (needed for Kanban board)
router.get("/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;

    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Get all tasks associated with this project
    const tasks = await Task.find({
      _id: { $in: project.task },
    }).populate("assignee reporter", "name email"); // Populate user details

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update a task (for changing status via drag and drop)
// Update the task update route to fix the team activity log and add missing activity logs

// router.put("/:taskId", async (req, res) => {
//   try {
//     const { taskId } = req.params;
//     const updates = req.body;
//     const userId = updates.userId || updates.reporter; // Get user who made the change

//     // Find the task
//     const task = await Task.findById(taskId);
//     if (!task) {
//       return res.status(404).json({ message: "Task not found" });
//     }

//     // Fix team reference
//     if (updates.team !== undefined) {
//       // Store old team value for activity logging
//       const oldTeam = task.team;
//       // Update team field
//       task.team = updates.team || null;

//       // Log team change only if it actually changed
//       const teamChanged =
//         (!oldTeam && updates.team) ||
//         (oldTeam && !updates.team) ||
//         (oldTeam &&
//           updates.team &&
//           oldTeam.toString() !== updates.team.toString());

//       if (teamChanged) {
//         task.activityLog.push({
//           user: userId,
//           action: updates.team ? "Team Assigned" : "Team Removed",
//           details: { team: updates.team || "None" },
//           timestamp: new Date(),
//         });
//       }
//     }

//     // Track if status was changed
//     const statusChanged = updates.status && updates.status !== task.status;
//     const oldStatus = task.status;

//     // Track if title was changed
//     const titleChanged = updates.title && updates.title !== task.title;
//     const oldTitle = task.title;

//     // Track if description was changed
//     const descriptionChanged =
//       updates.description !== undefined &&
//       updates.description !== task.description;
//     const oldDescription = task.description;

//     // Track if reporter was changed
//     const reporterChanged =
//       updates.reporter &&
//       (!task.reporter ||
//         task.reporter.toString() !== updates.reporter.toString());
//     const oldReporter = task.reporter;

//     // Track if assignee was changed
//     const assigneeChanged =
//       updates.assignee !== undefined &&
//       ((!task.assignee && updates.assignee) ||
//         (task.assignee && !updates.assignee) ||
//         (task.assignee &&
//           updates.assignee &&
//           task.assignee.toString() !== updates.assignee.toString()));
//     const oldAssignee = task.assignee;

//     // Track if priority was changed
//     const priorityChanged =
//       updates.priority && updates.priority !== task.priority;
//     const oldPriority = task.priority;

//     const dueDateChanged =
//       updates.hasOwnProperty("dueDate") &&
//       ((!task.dueDate && updates.dueDate) ||
//         (task.dueDate && !updates.dueDate) ||
//         (task.dueDate &&
//           updates.dueDate &&
//           new Date(task.dueDate).getTime() !==
//             new Date(updates.dueDate).getTime()));
//     const oldDueDate = task.dueDate;

//     console.log("At backend", dueDateChanged);
//     console.log("At backend", updates.dueDate);

//     // Check if the status is being changed to DONE
//     if (updates.status === "DONE" && task.status !== "DONE") {
//       task.completedAt = new Date();
//     } else if (updates.status !== "DONE") {
//       task.completedAt = null; // Reset if moving back from DONE
//     }
//     // Update task fields
//     Object.keys(updates).forEach((key) => {
//       if (
//         key !== "userId" &&
//         key !== "activityLog" &&
//         key !== "team" &&
//         key !== "attachments" &&
//         key !== "subTask"
//       ) {
//         // Skip team as we handled it separately
//         task[key] = updates[key];
//       }
//     });

//     // Add activity log entries for each specific change

//     // Title change
//     if (titleChanged) {
//       task.activityLog.push({
//         user: userId,
//         action: "Title Changed",
//         details: { from: oldTitle, to: updates.title },
//         timestamp: new Date(),
//       });
//     }

//     // Description change
//     if (descriptionChanged) {
//       task.activityLog.push({
//         user: userId,
//         action: "Description Changed",
//         details: {
//           from: oldDescription
//             ? oldDescription.length > 50
//               ? oldDescription.substring(0, 50) + "..."
//               : oldDescription
//             : "None",
//           to: updates.description
//             ? updates.description.length > 50
//               ? updates.description.substring(0, 50) + "..."
//               : updates.description
//             : "None",
//         },
//         timestamp: new Date(),
//       });
//     }

//     // Status change
//     if (statusChanged) {
//       task.activityLog.push({
//         user: userId,
//         action: "Status Changed",
//         details: { from: oldStatus, to: updates.status },
//         timestamp: new Date(),
//       });
//     }

//     // Priority change
//     if (priorityChanged) {
//       task.activityLog.push({
//         user: userId,
//         action: "Priority Changed",
//         details: { from: oldPriority, to: updates.priority },
//         timestamp: new Date(),
//       });
//     }

//     // Reporter change
//     if (reporterChanged) {
//       task.activityLog.push({
//         user: userId,
//         action: "Reporter Changed",
//         details: {
//           from: oldReporter || "None",
//           to: updates.reporter || "None",
//         },
//         timestamp: new Date(),
//       });
//     }

//     // Assignee change
//     if (assigneeChanged) {
//       task.activityLog.push({
//         user: userId,
//         action: updates.assignee ? "Assignee Changed" : "Assignee Removed",
//         details: {
//           from: oldAssignee || "None",
//           to: updates.assignee || "None",
//         },
//         timestamp: new Date(),
//       });
//     }
//     if (dueDateChanged) {
//       task.activityLog.push({
//         user: userId,
//         action: "Due Date Changed",
//         details: { from: oldDueDate, to: updates.dueDate },
//         timestamp: new Date(),
//       });
//     }

//     await task.save();

//     // If this task is part of a project and status was changed to DONE,
//     // update project progress
//     if (statusChanged && updates.status === "DONE") {
//       // Find the project containing this task
//       const project = await Project.findOne({ task: taskId });

//       if (project) {
//         const tasks = await Task.find({ _id: { $in: project.task } }, "status");
//         const completedTasks = tasks.filter(
//           (task) => task.status === "DONE"
//         ).length;
//         project.progress = Math.round((completedTasks / tasks.length) * 100);
//         await project.save();
//       }
//     }

//     // Return the updated task with populated fields
//     const updatedTask = await Task.findById(taskId)
//       .populate("assignee", "name email")
//       .populate("reporter", "name email")
//       .populate("team", "name")
//       .populate("attachments.uploadedBy", "name email")
//       .populate("dueDate", "dueDate")
//       .populate({
//         path: "subTask",
//         populate: [
//           { path: "assignee", select: "name email" },
//           { path: "reporter", select: "name email" },
//           { path: "createdBy", select: "name email" },
//           { path: "parentTask", select: "title" },
//           { path: "title", select: "title" },
//           { path: "description", select: "description" },
//           { path: "status", select: "status" },
//           { path: "priority", select: "priority" },
//           { path: "dueDate", select: "dueDate" },
//         ],
//       });
//     const subtasks = await Subtask.find({
//       _id: { $in: task.subTask },
//     })
//       .populate("assignee", "name email")
//       .populate("reporter", "name email")
//       .populate("createdBy", "name email")
//       .populate("parentTask", "title")
//       .populate("title", "title")
//       .populate("description", "description")
//       .populate("status", "status")
//       .populate("priority", "priority")
//       .populate("dueDate", "dueDate");
//     updatedTask.subTask = subtasks;
//     console.log("At backend", updatedTask);
//     res.status(200).json(updatedTask);
//   } catch (error) {
//     console.error("Error updating task:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// });

router.put("/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;
    const userId = updates.userId || updates.reporter;

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Save original values for change tracking
    const originalValues = captureOriginalValues(task);
    
    // Handle status completion time
    handleCompletionTime(task, updates);
    
    // Update team field separately (special handling)
    handleTeamUpdate(task, updates, userId);
    
    // Update basic task fields
    updateTaskFields(task, updates);
    
    // Record all changes to activity log
    logActivityChanges(task, originalValues, updates, userId);
    
    await task.save();

    // Update project progress if task status changed to DONE
    await updateProjectProgress(taskId, originalValues.status, updates.status);
    
    // Return the updated task with populated fields
    const updatedTask = await getPopulatedTask(taskId);
    
    res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Helper functions
function captureOriginalValues(task) {
  return {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    reporter: task.reporter,
    assignee: task.assignee,
    dueDate: task.dueDate,
    team: task.team
  };
}

function handleCompletionTime(task, updates) {
  if (updates.status === "DONE" && task.status !== "DONE") {
    task.completedAt = new Date();
  } else if (updates.status && updates.status !== "DONE") {
    task.completedAt = null;
  }
}

function handleTeamUpdate(task, updates, userId) {
  if (updates.team === undefined) return;
  
  const oldTeam = task.team;
  task.team = updates.team || null;
  
  const teamChanged = 
    (!oldTeam && updates.team) ||
    (oldTeam && !updates.team) ||
    (oldTeam && updates.team && oldTeam.toString() !== updates.team.toString());
  
  if (teamChanged) {
    task.activityLog.push({
      user: userId,
      action: updates.team ? "Team Assigned" : "Team Removed",
      details: { team: updates.team || "None" },
      timestamp: new Date()
    });
  }
}

function updateTaskFields(task, updates) {
  const skipFields = ['userId', 'activityLog', 'team', 'attachments', 'subTask'];
  
  Object.keys(updates).forEach(key => {
    if (!skipFields.includes(key)) {
      task[key] = updates[key];
    }
  });
}

function logActivityChanges(task, original, updates, userId) {
  // Check and log various field changes
  logFieldChange(task, 'title', original.title, updates.title, userId);
  logFieldChange(task, 'description', original.description, updates.description, userId);
  logFieldChange(task, 'status', original.status, updates.status, userId);
  logFieldChange(task, 'priority', original.priority, updates.priority, userId);
  logDueDate(task, original.dueDate, updates.dueDate, userId);
  logEntityChange(task, 'reporter', original.reporter, updates.reporter, userId);
  logAssigneeChange(task, original.assignee, updates.assignee, userId);
}

function logFieldChange(task, field, oldValue, newValue, userId) {
  if (!newValue || oldValue === newValue) return;
  
  const capitalizedField = field.charAt(0).toUpperCase() + field.slice(1);
  
  let details = { from: oldValue, to: newValue };
  
  // Special handling for description to truncate long text
  if (field === 'description') {
    details = {
      from: formatDescription(oldValue),
      to: formatDescription(newValue)
    };
  }
  
  task.activityLog.push({
    user: userId,
    action: `${capitalizedField} Changed`,
    details,
    timestamp: new Date()
  });
}

function formatDescription(text) {
  if (!text) return "None";
  return text.length > 50 ? text.substring(0, 50) + "..." : text;
}

function logDueDate(task, oldDate, newDate, userId) {
  if (newDate === undefined) return;
  
  const dateChanged = 
    (!oldDate && newDate) ||
    (oldDate && !newDate) ||
    (oldDate && newDate && new Date(oldDate).getTime() !== new Date(newDate).getTime());
    
  if (dateChanged) {
    task.activityLog.push({
      user: userId,
      action: "Due Date Changed",
      details: { from: oldDate, to: newDate },
      timestamp: new Date()
    });
  }
}

function logEntityChange(task, field, oldValue, newValue, userId) {
  if (!newValue) return;
  
  const valueChanged = 
    !oldValue || 
    oldValue.toString() !== newValue.toString();
    
  if (valueChanged) {
    const capitalizedField = field.charAt(0).toUpperCase() + field.slice(1);
    
    task.activityLog.push({
      user: userId,
      action: `${capitalizedField} Changed`,
      details: {
        from: oldValue || "None",
        to: newValue || "None"
      },
      timestamp: new Date()
    });
  }
}

function logAssigneeChange(task, oldAssignee, newAssignee, userId) {
  if (newAssignee === undefined) return;
  
  const assigneeChanged = 
    (!oldAssignee && newAssignee) ||
    (oldAssignee && !newAssignee) ||
    (oldAssignee && newAssignee && oldAssignee.toString() !== newAssignee.toString());
    
  if (assigneeChanged) {
    task.activityLog.push({
      user: userId,
      action: newAssignee ? "Assignee Changed" : "Assignee Removed",
      details: {
        from: oldAssignee || "None",
        to: newAssignee || "None"
      },
      timestamp: new Date()
    });
  }
}

async function updateProjectProgress(taskId, oldStatus, newStatus) {
  if (newStatus !== "DONE" || oldStatus === "DONE") return;
  
  // Find the project containing this task
  const project = await Project.findOne({ task: taskId });
  if (!project) return;
  
  const tasks = await Task.find({ _id: { $in: project.task } }, "status");
  const completedTasks = tasks.filter(task => task.status === "DONE").length;
  project.progress = Math.round((completedTasks / tasks.length) * 100);
  await project.save();
}

async function getPopulatedTask(taskId) {
  const task = await Task.findById(taskId)
    .populate("assignee", "name email")
    .populate("reporter", "name email")
    .populate("team", "name")
    .populate("attachments.uploadedBy", "name email")
    .populate("dueDate", "dueDate")
    .populate({
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
        { path: "dueDate", select: "dueDate" }
      ]
    });
    
  // Handle subtasks separately
  const subtasks = await Subtask.find({ _id: { $in: task.subTask } })
    .populate("assignee", "name email")
    .populate("reporter", "name email")
    .populate("createdBy", "name email")
    .populate("parentTask", "title")
    .populate("title", "title")
    .populate("description", "description")
    .populate("status", "status")
    .populate("priority", "priority")
    .populate("dueDate", "dueDate");
    
  task.subTask = subtasks;
  return task;
}

// Delete a task
router.delete("/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Find the project that contains this task
    const project = await Project.findOne({ task: taskId });

    if (project) {
      // Remove the task from the project
      project.task = project.task.filter((id) => id.toString() !== taskId);

      // Delete all subtasks associated with this task
      if (task.subTask && task.subTask.length > 0) {
        await Subtask.deleteMany({ _id: { $in: task.subTask } });
      }

      // Update project progress
      await project.save();

      // Recalculate project progress after task removal
      const remainingTasks = await Task.find(
        { _id: { $in: project.task } },
        "status"
      );
      if (remainingTasks.length > 0) {
        const completedTasks = remainingTasks.filter(
          (task) => task.status === "DONE"
        ).length;
        project.progress = Math.round(
          (completedTasks / remainingTasks.length) * 100
        );
        await project.save();
      } else {
        // If no tasks remain, set progress to 0
        project.progress = 0;
        await project.save();
      }
    }

    // Delete the task
    await Task.findByIdAndDelete(taskId);

    res.status(200).json({
      message: "Task deleted successfully",
      deletedTaskId: taskId,
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all tasks with specific status for a project
router.get("/:projectId/status/:status", async (req, res) => {
  try {
    const { projectId, status } = req.params;

    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Get all tasks with the specified status
    const tasks = await Task.find({
      _id: { $in: project.task },
      status: status.toUpperCase(), // Ensure status is uppercase for consistency
    }).populate("assignee reporter", "name email");

    res.status(200).json(tasks);
  } catch (error) {
    console.error(`Error fetching ${status} tasks:`, error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get counts of tasks by status for a project
router.get("/:projectId/status-counts", async (req, res) => {
  try {
    const { projectId } = req.params;

    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Get all tasks for this project
    const tasks = await Task.find({ _id: { $in: project.task } }, "status");

    // Count tasks by status
    const statusCounts = {
      BACKLOG: 0,
      "TO DO": 0,
      "IN PROGRESS": 0,
      REVIEW: 0,
      DONE: 0,
    };

    tasks.forEach((task) => {
      if (statusCounts.hasOwnProperty(task.status)) {
        statusCounts[task.status]++;
      }
    });

    res.status(200).json({
      totalTasks: tasks.length,
      statusCounts,
    });
  } catch (error) {
    console.error("Error fetching task status counts:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
