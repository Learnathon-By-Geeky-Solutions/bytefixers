const commentSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);
