const mongoose = require("mongoose");

const subtaskSchema = new mongoose.Schema(
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
      // required: true,
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
    activityLog: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        action: String,
        details: mongoose.Schema.Types.Mixed,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    dueDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    parentTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);
subtaskSchema.virtual("isCompleted").get(function () {
  return this.status === "DONE";
});
module.exports = mongoose.model("Subtask", subtaskSchema);
