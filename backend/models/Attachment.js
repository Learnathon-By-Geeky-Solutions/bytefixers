const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String },
  fileSize: { type: Number },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("Attachment", attachmentSchema);
