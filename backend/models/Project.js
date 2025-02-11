const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name required"],
      trim: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: {
      type: String,
      maxlength: [500, "Description too long"],
    },
    status: {
      type: String,
      enum: ["Planning", "Active", "On Hold", "Completed", "Archived"],
      default: "Planning",
    },
    task: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Task",
      },
    ],
    progress: {
      // Auto-calculated field
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { timestamps: true }
);

projectSchema.statics.calculateProgress = function (tasks) {
  if (tasks.length === 0) return 0;
  const completedTasks = tasks.filter(task => task.status === "Done").length;
  return Math.round((completedTasks / tasks.length) * 100);
};

// Export the Project model
module.exports = mongoose.model("Project", projectSchema);