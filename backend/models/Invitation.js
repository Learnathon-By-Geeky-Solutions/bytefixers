const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    validate: [validator.isEmail, "Invalid email"],
    index: true,
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
    index: true,
  },
  inviter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  token: { type: String, unique: true, required: true },
  role: { type: String, enum: ["member", "admin"], default: "member" },
  expiresAt: { type: Date, required: true },
  status: {
    type: String,
    enum: ["Pending", "Accepted", "Expired", "Revoked"],
    default: "Pending",
  },
});

// Auto-expire documents after 7 days
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
