const teamMemberSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: ["member", "admin"],
    default: "member",
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});
