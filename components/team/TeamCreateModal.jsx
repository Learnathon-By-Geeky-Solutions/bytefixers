import React, { useState } from "react";
import { authServices } from "../../auth";
import { ExpandLess, ExpandMore } from "../../common/icons";

export const TeamCreateModal = ({
  isOpen,
  onClose,
  members,
  setMembers,
  teamMembers,
  setTeamMembers,
  leader,
  setLeader,
  onCreateSuccess,
}) => {
  const [name, setName] = useState("");
  const [isDropdownteamMembers, setIsDropdownteamMembers] = useState(false);

  const [error, setError] = useState(null);

  const currentUser = authServices.getAuthUser();
  const userId = currentUser ? currentUser._id : null;

  const handleCreateTeam = async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/teams/create/${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, leader, teamMembers }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      const teamResponse = await fetch(
        `http://localhost:4000/teams/${data.team._id}`
      );
      const fullTeamData = await teamResponse.json();
      if (typeof onCreateSuccess === "function") {
        onCreateSuccess(fullTeamData);
      }
      setName("");
      setLeader(null);
      setTeamMembers([]);
      alert("Team created successfully!");
      onClose();
    } catch (error) {
      setError(error.message);
    }
  };
  const toggleDropdownteamMembers = () => {
    setIsDropdownteamMembers(!isDropdownteamMembers);
  };
  const handleLeaderChange = (e) => {
    const selectedLeader = members.find(
      (member) => member._id === e.target.value
    );
    setLeader(selectedLeader);
  };
  const handleSelectTeamMember = (memberId, isSelected) => {
    if (memberId === userId) return; // Prevent adding current user
    if (isSelected) {
      // Add member if not already selected
      setTeamMembers((prev) => [...prev, memberId]);
    } else {
      // Remove member if unchecked
      setTeamMembers((prev) => prev.filter((id) => id !== memberId));
    }
  };

  return (
    isOpen && (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg w-96">
          <h2 className="text-xl font-bold mb-4">Create Team</h2>
          {error && <p className="text-red-500">{error}</p>}

          <label className="font-semibold">Team Name :</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border p-2 rounded"
          />
          <div className="flex flex-col gap-2">
            <label className="font-semibold">Select Team Leader :</label>
            <select
              className="border p-2 rounded"
              value={leader?._id || ""}
              onChange={handleLeaderChange}
            >
              <option value="">Choose a leader</option>
              {members.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <label className="font-semibold">Select Team Members :</label>
            <div
              onClick={toggleDropdownteamMembers}
              className={`w-full flex items-center justify-between px-4 py-2 border ${
                isDropdownteamMembers ? "border-gray-700" : "border-gray-300"
              } rounded-md bg-white cursor-pointer transition-all duration-200`}
            >
              <span className="text-gray-700">
                {teamMembers.length > 0
                  ? `${teamMembers.length} members selected`
                  : "Select Team Members"}
              </span>
              {isDropdownteamMembers ? <ExpandLess /> : <ExpandMore />}
            </div>

            {isDropdownteamMembers && (
              <div className="absolute mt-2 w-48 bg-white border rounded shadow-lg p-2 z-50">
                {members
                  .filter(
                    (member) =>
                      member &&
                      member._id !== userId &&
                      leader &&
                      member._id !== leader?._id
                  )
                  .map((member) =>
                    member?.name ? (
                      <div
                        key={member._id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-200 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={teamMembers.includes(member._id)}
                          onChange={(e) =>
                            handleSelectTeamMember(member._id, e.target.checked)
                          }
                        />
                        {/* Fixed Avatar Component */}
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                          {member.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span>{member.name}</span>
                      </div>
                    ) : null
                  )}
              </div>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={onClose}
              className="mr-2 px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTeam}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    )
  );
};
