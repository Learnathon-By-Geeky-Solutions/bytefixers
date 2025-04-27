import React, { useEffect, useState } from "react";
import { Avatar } from "../../../common/icons";
import { authServices } from "../../../auth";
import PropTypes from "prop-types";
export const TaskCreate = ({ isOpen, onClose, onCreate, projectid }) => {
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    assignee: null,
    reporter: authServices.getAuthUser()._id,
    priority: "MEDIUM",
  });
  const [isDropdownAssigneeOpen, setIsDropdownAssigneeOpen] = useState(false);
  const [isDropdownReporterOpen, setIsDropdownReporterOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // eslint-disable-next-line
  const [project, setProject] = useState(null); // Store project data
  // eslint-disable-next-line
  const [members, setMembers] = useState([]); // Store members of the project
  const [userDetails, setUserDetails] = useState([]);
  const currentUser = authServices.getAuthUser(); // Retrieve stored user data
  const userName = currentUser ? currentUser.name : null;

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const response = await fetch(
          `http://localhost:4000/projects/${projectid}`
        );
        const data = await response.json();
        setProject(data);
        setMembers(data.members); // Set project members
        const memberDetails = await Promise.all(
          data.members.map((memberId) =>
            fetch(`http://localhost:4000/api/user/${memberId}`).then((res) =>
              res.json()
            )
          )
        );
        setUserDetails(memberDetails); // Set the fetched user details
      } catch (error) {
        console.error("Failed to fetch project details:", error);
        setError("Error fetching project data");
      }
    };

    if (isOpen) {
      fetchProjectDetails();
    }
  }, [projectid, isOpen]);
  // Handle Input Change
  const handleChange = (e) => {
    setTaskData({ ...taskData, [e.target.name]: e.target.value });
  };

  // Handle Task Creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:4000/tasks/${projectid}/addTasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(taskData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create task");
      }
      alert("Task Created Successfully");
      onCreate(data); // Update task list in parent component
      onClose(); // Close modal
    } catch (err) {
      setError(err.message);
      console.error("Failed to create task:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null; // Prevent rendering if modal is not open
  const toggleDropdownAssignee = () => {
    setIsDropdownAssigneeOpen(!isDropdownAssigneeOpen);
  };
  const toggleDropdownReporter = () => {
    setIsDropdownReporterOpen(!isDropdownReporterOpen);
  };
  const handleAssigneeSelect = (assigneeValue) => {
    setTaskData((prevData) => ({ ...prevData, assignee: assigneeValue }));
    setIsDropdownAssigneeOpen(false); // Close dropdown after selection
  };
  const handleReporterSelect = (reporterValue) => {
    setTaskData((prevData) => ({ ...prevData, reporter: reporterValue }));
    setIsDropdownReporterOpen(false); // Close dropdown after selection
  };
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-lg font-semibold mb-4">Create Task</h2>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col space-y-1">
          Task Title:{" "}
          <input
            type="text"
            name="title"
            placeholder="Task Title(Required)"
            value={taskData.title}
            onChange={handleChange}
            required
            className="border p-2 rounded mb-2"
          />
          <div className="mt-6">Task Description:</div>
          <textarea
            name="description"
            placeholder="Task Description"
            value={taskData.description}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <div className="mt-6">Assignee:</div>
          <div>
            <div className="modal-container">
              <form>
                <div className="relative">
                  <button
                    type="button"
                    className="border p-2 rounded w-full flex items-center space-x-2"
                    onClick={toggleDropdownAssignee}
                  >
                    <Avatar className="bg-blue-500">
                      {taskData.assignee
                        ? userDetails
                            .find((user) => user._id === taskData.assignee)
                            ?.name.substring(0, 2)
                            .toUpperCase()
                        : "Ua"}{" "}
                      {/* Use initials of the assignee or default to "Ua" */}
                    </Avatar>
                    <span className="text-gray-700">
                      {taskData.assignee
                        ? userDetails.find(
                            (user) => user._id === taskData.assignee
                          )?.name
                        : "Unassigned"}{" "}
                      {/* Display assignee's name or "Unassigned" */}
                    </span>
                  </button>

                  {/* Custom Dropdown */}
                  {isDropdownAssigneeOpen && (
                    <div className="absolute left-0 mt-2 w-full bg-white border rounded shadow-lg z-10">
                      {/* Option: Unassigned */}
                      <div
                        className="flex items-center p-2 cursor-pointer hover:bg-gray-200"
                        onClick={() => handleAssigneeSelect(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            handleAssigneeSelect(null);
                          }
                        }}
                      >
                        <Avatar className="bg-gray-500" />
                        <span className="text-gray-700">Unassigned</span>
                      </div>

                      {/* Options: Project Members */}
                      {userDetails.map((member) => (
                        <div
                          key={member._id}
                          className="flex items-center p-2 cursor-pointer hover:bg-gray-200"
                          onClick={() => handleAssigneeSelect(member._id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              handleAssigneeSelect(member._id);
                            }
                          }}
                        >
                          <Avatar className="bg-blue-500">
                            {member.name.substring(0, 2).toUpperCase()}
                          </Avatar>
                          <span className="text-gray-700">{member.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
          Reporter:
          <div className="modal-container">
            <form>
              <div className="relative">
                <button
                  type="button"
                  className="border p-2 rounded w-full flex items-center space-x-2"
                  onClick={toggleDropdownReporter}
                >
                  <Avatar className="bg-blue-500">
                    {taskData.reporter
                      ? userDetails
                          .find((user) => user._id === taskData.reporter)
                          ?.name.substring(0, 2)
                          .toUpperCase()
                      : userName
                      ? userName.substring(0, 2).toUpperCase()
                      : "No"}{" "}
                    {/* Use initials of the reporter or the logged-in user */}
                  </Avatar>
                  <span className="text-gray-700">
                    {taskData.reporter
                      ? userDetails.find(
                          (user) => user._id === taskData.reporter
                        )?.name
                      : userName || "Unknown User"}{" "}
                    {/* Display reporter's name or the logged-in user's name */}
                  </span>
                </button>

                {/* Custom Dropdown */}
                {isDropdownReporterOpen && (
                  <div className="absolute left-0 mt-2 w-full bg-white border rounded shadow-lg z-10">
                    {/* Options: Project Members */}
                    {userDetails.map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center p-2 cursor-pointer hover:bg-gray-200"
                        onClick={() => handleReporterSelect(member._id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            handleReporterSelect(member._id);
                          }
                        }}
                      >
                        <Avatar className="bg-blue-500">
                          {member.name.substring(0, 2).toUpperCase()}
                        </Avatar>
                        <span className="text-gray-700">{member.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>
          </div>
          Status:
          <select
            name="status"
            value={taskData.status}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="BACKLOG">BACKLOG</option>
            <option value="TO DO">TO DO</option>
            <option value="IN PROGRESS">IN PROGRESS</option>
            <option value="REVIEW">REVIEW</option>
            <option value="DONE">DONE</option>
          </select>{" "}
          Priority:
          <select
            name="priority"
            value={taskData.priority}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

TaskCreate.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  projectid: PropTypes.string.isRequired,
};
