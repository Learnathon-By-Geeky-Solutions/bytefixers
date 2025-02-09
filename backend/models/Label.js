const taskLabelSchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  label: { type: mongoose.Schema.Types.ObjectId, ref: "Label", required: true },
}, { timestamps: true });

taskLabelSchema.index({ task: 1, label: 1 }, { unique: true });

module.exports = mongoose.model("TaskLabel", taskLabelSchema);