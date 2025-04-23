const mongoose = require("mongoose");
const Attachment = require("./Attachment");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title required"],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [500, "Description too long"],
    },
    assignee: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      index: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["BACKLOG", "TO DO", "IN PROGRESS", "REVIEW", "DONE"],
      default: "BACKLOG",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },
    subTask: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Subtask",
        index: true,
      },
    ],
    activityLog: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        action: String,
        details: mongoose.Schema.Types.Mixed,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    dueDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    attachments: [Attachment.schema],
  },
  { timestamps: true }
);
taskSchema.virtual("isCompleted").get(function () {
  return this.status === "DONE";
});
module.exports = mongoose.model("Task", taskSchema);
