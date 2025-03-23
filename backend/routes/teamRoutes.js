const express = require("express");
const mongoose = require("mongoose");
const Team = require("../models/Team");
const User = require("../models/user");

const router = express.Router();

// Create a new team
router.post("/create/:userId", async (req, res) => {
    try {
        const { name, leader, teamMembers } = req.body;
        const { userId } = req.params;

        // Ensure the teamMembers array includes the leader or creator
        const members = teamMembers && Array.isArray(teamMembers) ? teamMembers : [];
        if (!members.includes(leader || userId)) {
            members.push(leader || userId);
        }

        // Set teamCreator as leader if no leader is provided
        const team = new Team({
            name,
            leader: leader || userId,
            teamCreator: userId,
            teamMember: members,
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
        const { teamMembers } = req.body;
        const { teamId } = req.params;

        // Validate team
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ message: "Team not found" });
        }

        // Validate users
        const validUsers = await User.find({ _id: { $in: teamMembers } });
        const validUserIds = validUsers.map(user => user._id.toString());

        // Filter out already assigned members
        const newMembers = validUserIds.filter(id => !team.teamMember.includes(id));

        if (newMembers.length === 0) {
            return res.status(400).json({ message: "All users are already in the team" });
        }

        team.teamMember.push(...newMembers);
        await team.save();

        res.status(200).json({ message: "Users assigned to team", team });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Fetch teams where user is creator or member
router.get("/my-teams/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const teams = await Team.find({
            $or: [
                { teamCreator: userId },
                { teamMember: userId }
            ]
        }).populate("leader teamCreator teamMember");

        res.status(200).json({ teams });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
