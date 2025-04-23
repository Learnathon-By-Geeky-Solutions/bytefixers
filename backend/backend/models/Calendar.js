const mongoose = require("mongoose");

const calendarEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    eventType: {
      type: String,
      enum: ["TASK_DUE", "MILESTONE", "MEETING", "REMINDER"],
      default: "MEETING",
    },
    status: {
      type: String,
      enum: ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      default: "SCHEDULED",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrencePattern: {
      frequency: {
        type: String,
        enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
      },
      interval: {
        type: Number,
        default: 1,
      },
      endDate: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CalendarEvent", calendarEventSchema);
