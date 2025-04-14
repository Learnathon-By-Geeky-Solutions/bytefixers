import React, { useEffect, useState } from "react";
import {
  Avatar,
  AvatarGroup,
  IconButton,
  MoreVert,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from "../../common/icons";
import { authServices } from "../../auth";
import { AddMembersModal } from "./AddMembersModal";
import axios from "axios";
const useForceUpdate = () => {
  // eslint-disable-next-line
  const [value, setValue] = useState(0);
  return () => setValue((value) => value + 1);
};
export const TeamList = ({ teams, setTeams, members, teamMembers }) => {
  // const [teams, setTeams] = useState([]);
  const forceUpdate = useForceUpdate();
  const currentUser = authServices.getAuthUser();
  const userId = currentUser ? currentUser._id : null;
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([]);
  // For menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [clickedTeam, setClickedTeam] = useState(null);

  // For confirmation dialogs
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Store colors in a map using team IDs as keys
  const [teamColors, setTeamColors] = useState({});
  const [memberColors, setMemberColors] = useState({});

  // Generate consistent colors based on ID
  const getConsistentColor = (id) => {
    if (memberColors[id]) {
      return memberColors[id];
    }

    // Simple hash function to convert string ID to a number
    const hash = id.split("").reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);

    // Use the hash to generate a consistent color
    const hue = hash % 360;
    const color = `hsl(${hue}, 70%, 65%)`;

    // Save the color for this ID
    setMemberColors((prev) => ({ ...prev, [id]: color }));
    return color;
  };

  // Generate consistent gradient for team
  const getConsistentGradient = (teamId) => {
    if (teamColors[teamId]) {
      return teamColors[teamId];
    }

    const lightColors = ["#B0C4DE", "#D3D3D3", "#ADD8E6", "#FAFAD2", "#F0E68C"];

    // Use the teamId to consistently select colors
    const hash = teamId.split("").reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);

    const index1 = hash % lightColors.length;
    const index2 = (hash * 13) % lightColors.length; // Use a prime number for more variation

    const gradient = `linear-gradient(to bottom, ${lightColors[index1]}, ${lightColors[index2]})`;

    // Save the gradient for this team
    setTeamColors((prev) => ({ ...prev, [teamId]: gradient }));
    return gradient;
  };

  // Open the three-dot menu
  const handleMenuClick = (event, team) => {
    event.stopPropagation(); // Prevent opening the AddMembersModal
    setAnchorEl(event.currentTarget);
    setClickedTeam(team);
  };

  // Close the three-dot menu
  const handleMenuClose = (event) => {
    if (event) event.stopPropagation();
    setAnchorEl(null);
  };

  // Show leave team confirmation
  const handleLeaveTeamClick = (event) => {
    event.stopPropagation();
    handleMenuClose(event);
    setShowLeaveDialog(true);
  };

  // Show delete team confirmation
  const handleDeleteTeamClick = (event) => {
    event.stopPropagation();
    handleMenuClose(event);
    setShowDeleteDialog(true);
  };

  // Handle the leave team action
  const handleLeaveTeam = async () => {
    try {
      // eslint-disable-next-line
      const response = await axios.post(
        `http://localhost:4000/teams/leave/${clickedTeam._id}`,
        { userId }
      );
      setTeams((prevTeams) =>
        prevTeams.filter((team) => team._id !== clickedTeam._id)
      );

      setShowLeaveDialog(false);
      setClickedTeam(null);
      setTimeout(() => {
        forceUpdate();
      }, 1);
    } catch (error) {
      console.error("Error leaving team:", error);
      alert(error.response?.data?.message || "Failed to leave team");
    }
  };

  // Handle the delete team action
  const handleDeleteTeam = async () => {
    try {
      // eslint-disable-next-line
      const response = await axios.delete(
        `http://localhost:4000/teams/${clickedTeam._id}`,
        { data: { userId } }
      );

      // Remove the deleted team from the list
      setTeams((prevTeams) =>
        prevTeams.filter((team) => team._id !== clickedTeam._id)
      );

      setShowDeleteDialog(false);
      setClickedTeam(null);
    } catch (error) {
      console.error("Error deleting team:", error);
      alert(error.response?.data?.message || "Failed to delete team");
    }
  };
  const openModal = (team) => {
    setSelectedTeamId(team._id);
    setShowAddMembersModal(true);
    setSelectedTeamMembers(team.teamMember.map((m) => m._id)); // Store members for modal
    console.log("Selected Team Members:", team.teamMember);
    console.log("Selected Team id:", team._id);
  };
  const closeModal = () => {
    // setIsTeamModalOpen(false);
    console.log("Closing Modal"); // Debugging
    setSelectedTeamId(null);
    setSelectedTeamMembers([]);
    setShowAddMembersModal(false);
  };

  const handleAddMembers = (updatedTeam) => {
    setTeams((prevTeams) =>
      prevTeams.map((team) =>
        team._id === updatedTeam._id ? updatedTeam : team
      )
    );
    if (selectedTeamId === updatedTeam._id) {
      setSelectedTeamMembers(updatedTeam.teamMember || []);
    }
    setShowAddMembersModal(false);
  };
  useEffect(() => {
    console.log("Received Members in TeamList:", members);
    console.log("Received Team Members in TeamList:", teamMembers);
  }, [members, teamMembers]);
  useEffect(() => {
    console.log("Teams prop changed to:", teams);
  }, [teams]);

  return (
    <div className="grid grid-cols-3 gap-4 p-4 ml-28 absolute">
      {teams.map((team) => (
        <div
          key={team._id}
          className="bg-white rounded-lg shadow-md border w-64 cursor-pointer"
          onClick={() => openModal(team)}
        >
          {/* Gradient Header */}
          <div
            className="h-20 rounded-t-lg"
            style={{ background: getConsistentGradient(team._id) }}
          ></div>

          {/* Team Name */}
          <div className="flex justify-between p-4 text-center font-semibold">
            {team.name}
            <IconButton
              className="absolute right-2 top-2 z-10"
              aria-label="options"
              onClick={(e) => handleMenuClick(e, team)}
            >
              <MoreVert />
            </IconButton>
          </div>

          {/* Member Avatars */}
          <div className="flex justify-center pb-4">
            <AvatarGroup max={4}>
              {team.teamMember.map((member) =>
                member && member.name && member._id ? (
                  <Avatar
                    key={member._id}
                    className="w-8 h-8"
                    style={{ backgroundColor: getConsistentColor(member._id) }}
                  >
                    {member.name.substring(0, 2).toUpperCase()}
                  </Avatar>
                ) : (
                  // If member is null or doesn't have a name, show default initials or a fallback UI
                  <Avatar
                    key={member._id}
                    className="w-8 h-8"
                    style={{ backgroundColor: "#888888" }}
                  >
                    "NN"
                  </Avatar>
                )
              )}
            </AvatarGroup>
          </div>
          {console.log("Team Members:", team.teamMember)}
          {console.log("existing Members:", teamMembers)}
          {console.log("All Members:", members)}
        </div>
      ))}
      {/* Three-dot menu */}
      {/* Menu for three dots */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleLeaveTeamClick}>Leave Team</MenuItem>
        {clickedTeam &&
          clickedTeam.teamCreator &&
          clickedTeam.teamCreator._id === userId && (
            <MenuItem onClick={handleDeleteTeamClick}>Delete Team</MenuItem>
          )}
      </Menu>

      {/* Leave Team Confirmation Dialog */}
      <Dialog
        open={showLeaveDialog}
        onClose={() => setShowLeaveDialog(false)}
        aria-labelledby="leave-team-dialog-title"
      >
        <DialogTitle id="leave-team-dialog-title">Leave Team</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to leave this team? You will no longer have
            access to this team's resources.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLeaveDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLeaveTeam} color="primary" autoFocus>
            Leave Team
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Team Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        aria-labelledby="delete-team-dialog-title"
      >
        <DialogTitle id="delete-team-dialog-title">Delete Team</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this team? This action cannot be
            undone and all team data will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteTeam} color="error" autoFocus>
            Delete Team
          </Button>
        </DialogActions>
      </Dialog>
      {showAddMembersModal && (
        <AddMembersModal
          teamId={selectedTeamId}
          isOpen={showAddMembersModal}
          onClose={closeModal}
          onUpdate={handleAddMembers}
          allMembers={members}
          existingMembers={selectedTeamMembers}
        />
      )}
    </div>
  );
};
