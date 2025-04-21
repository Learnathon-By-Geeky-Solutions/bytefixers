const express = require("express");
const emailConfig = require("../config/emailConfig"); // Adjust the path as needed
const router = express.Router();
const Project = require("../models/Project");
const User = require("../models/user");
router.post("/send-invite", async (req, res) => {
  const { email, projectId } = req.body;

  if (!email || !projectId) {
    return res.status(400).json({ error: "Email and Project ID are required" });
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9.-]{1,255}\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(String(email).trim())) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    // Generate the invite link
    let inviteLink = `http://localhost:4000/sendEmail/accept-invite?email=${email}&projectId=${projectId}`;
    // Send invitation email
    await emailConfig(email, projectId, inviteLink);

    res.status(200).json({ message: "Invitation sent successfully!" });
  } catch (error) {
    console.error("Invite send error:", error);
    res.status(500).json({ error: "Failed to send invitation" });
  }
});
router.get("/accept-invite", async (req, res) => {
  const { email, projectId } = req.query;
  console.log("Email:", email);
  if (!email || !projectId) {
    return res.status(400).json({ error: "Email and Project ID are required" });
  }

  try {
    const sanitizedEmail = String(email).trim();
    const user = await User.findOne({ email: sanitizedEmail });

    if (!user) {
      // User not registered → Redirect to signup
      return res.redirect(
        `http://localhost:3000/signup?email=${email}&projectId=${projectId}`
      );
    }
    const project = await Project.findById(projectId);
    console.log(`User ${user._id} is already a member`);
    // If user is already a member of the project
    if (!project.members.includes(user._id)) {
      console.log("Adding user to project");
      await Project.findByIdAndUpdate(projectId, {
        $addToSet: { members: user._id },
      });
    }
    return res.redirect(
      `http://localhost:3000/login?email=${email}&projectId=${projectId}`
    );
  } catch (error) {
    console.error("Invite accept error:", error);
    res.status(500).json({ error: "Failed to process invitation" });
  }
});

module.exports = router;
