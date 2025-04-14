const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Team name required"],
      trim: true,
      maxlength: [50, "Team name too long"],
      unique: true,
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    teamMember: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],
    teamCreator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Team", teamSchema);

// Cascade delete middleware
teamSchema.pre("deleteOne", async function (next) {
  const teamId = this.getQuery()._id;
  await mongoose.model("Project").deleteMany({ team: teamId });
  await mongoose.model("Invitation").deleteMany({ team: teamId });
  await mongoose.model("TeamMember").deleteMany({ team: teamId });
  next();
});
