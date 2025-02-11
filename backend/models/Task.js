const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Task title required"],
    trim: true
  },
  assignee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    index: true 
  },
  reporter: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },
  status: {
    type: String,
    enum: ["Backlog", "Todo", "In Progress", "Review", "Done"],
    default: "Backlog"
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Medium"
  },
  activityLog: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: String,
    details: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);