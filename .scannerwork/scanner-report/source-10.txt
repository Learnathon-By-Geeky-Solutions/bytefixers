const express = require("express");
const mongoose = require("mongoose");
const Team = require("../models/Team");
const User = require("../models/user");

const router = express.Router();

// Create a new team
router.post("/create/:userId", async (req, res) => {
  try {
    const { name, leader: providedLeader, teamMembers } = req.body;
    const { userId } = req.params;
    const leader = providedLeader || userId;

    // Ensure the teamMembers array includes the leader or creator
    const members = new Set(Array.isArray(teamMembers) ? teamMembers : []);
    members.add(userId);
    if (leader && leader !== userId) {
      members.add(leader._id); // Add leader if it's different from userId
    }
    console.log("Members length:", members.size);
    console.log("Members:", members);

    // Set teamCreator as leader if no leader is provided
    const team = new Team({
      name,
      leader: leader,
      teamCreator: userId,
      teamMember: Array.from(members),
    });

    await team.save();
    res.status(201).json({ message: "Team created successfully", team });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Team name already exists" });
    }
    res.status(500).json({ message: error.message });
  }
});

// Assign multiple members to a team
router.post("/assign/:teamId", async (req, res) => {
  try {
    console.log("length ", req.body.teamMembers.length);
    const { teamMembers } = req.body;
    const { teamId } = req.params;

    console.log("Team Members in Backend:", teamMembers);

    // Validate team
    const team = await Team.findById(teamId);
    console.log("Before ", team.teamMember);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Validate that teamMembers is an array
    if (!Array.isArray(teamMembers)) {
      throw new Error("Team members must be an array");
    }

    // Sanitize and validate each team member ID
    const sanitizedTeamMembers = teamMembers.map((memberId) => {
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        throw new Error("Invalid team member ID");
      }
      return new mongoose.Types.ObjectId(String(memberId));
    });

    // Query with validated and sanitized IDs
    const validUsers = await User.find({ _id: { $in: sanitizedTeamMembers } });
    const validUserIds = validUsers.map((user) => user._id.toString());

    // Filter out already assigned members
    const newMembers = validUserIds.filter(
      (id) => !team.teamMember.includes(id)
    );

    if (newMembers.length === 0) {
      return res
        .status(400)
        .json({ message: "All users are already in the team" });
    }
    console.log("New Members:", newMembers);
    console.log("Team Members:", team.teamMember);

    team.teamMember.push(...newMembers);
    await team.save();

    res.status(200).json({ message: "Users assigned to team", team });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch teams where user is the creator or a member
router.get("/my-teams/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const teams = await Team.find({
      $or: [{ teamMember: { $in: [userId] } }],
    }).populate("leader teamCreator teamMember");

    res.status(200).json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Get a single team by ID with populated member data
router.get("/:teamId", async (req, res) => {
  try {
    const { teamId } = req.params;

    // Validate teamId format
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ message: "Invalid team ID format" });
    }

    // Find the team and populate all member fields
    const team = await Team.findById(teamId)
      .populate("leader")
      .populate("teamCreator")
      .populate("teamMember");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.status(200).json(team);
  } catch (error) {
    console.error("Error fetching team:", error);
    res.status(500).json({ message: error.message });
  }
});
// Leave a team (for team members)
router.post("/leave/:teamId", async (req, res) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.body;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(teamId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Find the team
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if the user is a team member
    const isMember = team.teamMember.some(
      (memberId) => memberId && memberId.toString() === userId
    );

    if (!isMember) {
      return res
        .status(400)
        .json({ message: "User is not a member of this team" });
    }

    // Check if this user is the team leader
    const isLeader = team.leader && team.leader.toString() === userId;

    // Filter out the leaving user from team members
    const otherMembers = team.teamMember.filter(
      (memberId) => memberId && memberId.toString() !== userId
    );

    // If the user is the leader and there are other members, transfer leadership
    if (isLeader && otherMembers.length > 0) {
      team.leader = otherMembers[0];
    }

    // Remove the user from the team
    team.teamMember = otherMembers;

    // If no members remain, delete the team
    if (team.teamMember.length === 0) {
      await Team.findByIdAndDelete(teamId);
      return res.status(200).json({
        message: "You were the last member. Team has been deleted.",
        deletedTeamId: teamId,
      });
    }

    await team.save();

    // Fetch the updated team with populated data for response
    const updatedTeam = await Team.findById(teamId)
      .populate("leader")
      .populate("teamCreator")
      .populate("teamMember");

    res.status(200).json({
      message: "Successfully left the team",
      team: updatedTeam,
    });
  } catch (error) {
    console.error("Error leaving team:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a team (only for team creators)
router.delete("/:teamId", async (req, res) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.body; // ID of the user attempting to delete the team

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(teamId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Find the team
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if the user is the team creator
    if (team.teamCreator.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Only the team creator can delete the team" });
    }

    // Delete the team
    await Team.findByIdAndDelete(teamId);

    res.status(200).json({
      message: "Team deleted successfully",
      deletedTeamId: teamId,
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;
