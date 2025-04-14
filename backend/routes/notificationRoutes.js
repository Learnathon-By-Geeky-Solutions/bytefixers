const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const Project = require("../models/Project");
const Task = require("../models/Task");

// Get notifications for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;

    const notifications = await Notification.find({
      recipients: userId,
    })
      .populate("createdBy", "name email")
      .populate("projectId", "name")
      .populate("taskId", "title")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Notification.countDocuments({ recipients: userId });

    res.json({
      notifications,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: error.message });
  }
});

// Create a new notification
router.post("/", async (req, res) => {
  try {
    const { message, type, projectId, taskId, createdBy, isImportant } =
      req.body;

    // Get project members as recipients
    const project = await Project.findById(projectId).populate("members");
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Get task assignee and reporter if it's a task notification
    let additionalRecipients = [];
    if (taskId) {
      const task = await Task.findById(taskId);
      if (task) {
        if (task.assignee) additionalRecipients.push(task.assignee);
        if (task.reporter) additionalRecipients.push(task.reporter);
      }
    }

    // Combine all recipients and remove duplicates
    const allRecipients = [
      ...new Set([
        ...project.members.map((member) => member._id.toString()),
        ...additionalRecipients.map((id) => id.toString()),
      ]),
    ];

    const notification = new Notification({
      message,
      type,
      projectId,
      taskId,
      recipients: allRecipients,
      createdBy,
      isImportant,
    });

    await notification.save();

    const populatedNotification = await Notification.findById(notification._id)
      .populate("createdBy", "name email")
      .populate("projectId", "name")
      .populate("taskId", "title")
      .populate("recipients", "name email");
    console.log("Populated notification:", populatedNotification);
    res.status(201).json(populatedNotification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: error.message });
  }
});

// Mark a notification as read
router.put("/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Only add to read array if not already read by this user
    if (!notification.read.some((r) => r.userId.toString() === userId)) {
      notification.read.push({ userId, readAt: new Date() });
      await notification.save();
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark all notifications as read for a user
router.put("/mark-all-read", async (req, res) => {
  try {
    const { userId } = req.body;

    // Find all notifications for this user
    const notifications = await Notification.find({ recipients: userId });

    // Mark each notification as read for this user only
    for (const notification of notifications) {
      if (!notification.read.some((r) => r.userId.toString() === userId)) {
        notification.read.push({ userId, readAt: new Date() });
        await notification.save();
      }
    }

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Clear all notifications for a user
// Update the clear all route
router.delete("/clear-all", async (req, res) => {
  try {
    const { userId } = req.body;

    // Find all notifications for this user
    const notifications = await Notification.find({ recipients: userId });

    // Remove this user from recipients for all their notifications
    await Promise.all(
      notifications.map(async (notification) => {
        notification.recipients = notification.recipients.filter(
          (recipientId) => recipientId.toString() !== userId
        );

        if (notification.recipients.length === 0) {
          // Delete notification if no recipients left
          await Notification.findByIdAndDelete(notification._id);
        } else {
          // Save updated recipients list
          await notification.save();
        }
      })
    );

    res.json({ message: "All notifications cleared for user" });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a specific notification
router.delete("/:notificationId", async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    // Instead of deleting, remove user from recipients
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId },
      { $pull: { recipients: userId } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // If no recipients left, then delete the notification
    if (notification.recipients.length === 0) {
      await Notification.findByIdAndDelete(notificationId);
    }

    res.json({ message: "Notification removed for user" });
  } catch (error) {
    console.error("Error removing notification:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get unread count for a user
router.get("/unread-count/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const count = await Notification.countDocuments({
      recipients: userId,
      "read.userId": { $ne: userId },
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
