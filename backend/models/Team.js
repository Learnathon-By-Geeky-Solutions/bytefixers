const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Team name required"],
    trim: true,
    maxlength: [50, "Team name too long"]
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Team leader required"],
    index: true
  },
  inviteCode: {  // For public team joining
    type: String,
    unique: true
  }
}, { timestamps: true });

// Cascade delete middleware
teamSchema.pre("deleteOne", async function (next) {
  const teamId = this.getQuery()._id;
  await mongoose.model("Project").deleteMany({ team: teamId });
  await mongoose.model("Invitation").deleteMany({ team: teamId });
  await mongoose.model("TeamMember").deleteMany({ team: teamId });
  next();
});