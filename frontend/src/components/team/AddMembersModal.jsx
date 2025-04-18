import { useState, useEffect } from "react";
import axios from "axios";

export const AddMembersModal = ({
  teamId,
  isOpen,
  onClose,
  onUpdate,
  allMembers,
  existingMembers,
}) => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Filter out existing members from all members
      const filteredUsers = allMembers.filter(
        (user) => !existingMembers.includes(user._id)
      );
      setUsers(filteredUsers);
    }
  }, [isOpen, allMembers, existingMembers]);

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `http://localhost:4000/teams/assign/${teamId}`,
        {
          teamMembers: selectedUsers,
        }
      );
      console.log("Team Members:", selectedUsers);
      console.log("Response:", response.data);
      const teamResponse = await axios.get(
        `http://localhost:4000/teams/${teamId}`
      );

      console.log("Updated Team with populated data:", teamResponse.data);

      // Pass the complete team data with full member objects
      onUpdate(teamResponse.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add members");
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-5 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Add Members</h2>
        {error && <p className="text-red-500">{error}</p>}
        <div className="max-h-60 overflow-y-auto">
          {users.length > 0 ? (
            users.map((user) => (
              <div key={user._id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user._id)}
                  onChange={() => handleSelectUser(user._id)}
                />
                <span>{user.name}</span>
              </div>
            ))
          ) : (
            <p>No available members to add.</p>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="bg-gray-400 px-4 py-2 rounded" onClick={onClose}>
            Cancel
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={handleSubmit}
            disabled={loading || selectedUsers.length === 0}
          >
            {loading ? "Adding..." : "Add Members"}
          </button>
        </div>
      </div>
    </div>
  );
};
