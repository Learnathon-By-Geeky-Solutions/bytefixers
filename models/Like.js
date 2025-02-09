const likeSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Task reference required"],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference required"],
      index: true,
    },
    // Optional: Support multiple reaction types
    reaction: {
      type: String,
      enum: ["like", "heart", "celebrate", "insightful"],
      default: "like",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index to prevent duplicate likes
likeSchema.index({ task: 1, user: 1 }, { unique: true });

// Automatic population middleware
likeSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name email",
  });
  next();
});

// Update task's like count when a like is created/deleted
likeSchema.post("save", async function (doc) {
  await mongoose.model("Task").findByIdAndUpdate(doc.task, {
    $inc: { likeCount: 1 },
  });
});

likeSchema.post("remove", async function (doc) {
  await mongoose.model("Task").findByIdAndUpdate(doc.task, {
    $inc: { likeCount: -1 },
  });
});

module.exports = mongoose.model("Like", likeSchema);
