import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authServices } from "../../../auth"; // Adjust the import path as needed
import { useMembers } from "../../../context/MembersContext";
import { FileUpload } from "../../file/FileUpload";
import { SubtaskProgress } from "./SubtaskProgress";
import { SubtaskList } from "./SubtaskList";
import { useNotifications } from "../../../context/NotificationContext";
export const TaskDetails = () => {
  const { projectId } = useParams();
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const { addNotification } = useNotifications();
  const teamsLoaded = useRef(false);
  const [statusOptions] = useState([
    "BACKLOG",
    "TO DO",
    "IN PROGRESS",
    "REVIEW",
    "DONE",
  ]);
  const [priorityOptions] = useState(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
  const { members: projectMembers, loading: loadingMembers } = useMembers();
  // Get current user from auth service
  const currentUser = authServices.getAuthUser();

  // Fetch task details
  useEffect(() => {
    const fetchTask = async () => {
      try {
        console.log("Fetching task with ID:", taskId);
        const response = await fetch(
          `http://localhost:4000/tasks/task/${taskId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch task details");
        }
        const data = await response.json();
        setTask(data);
        if (data.subTask) {
          setSubtasks(data.subTask);
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  // Fetch teams where the current user is a member
  useEffect(() => {
    // Skip if already loaded or no user ID
    if (teamsLoaded.current || !currentUser?._id) {
      return;
    }

    const fetchTeams = async () => {
      try {
        setLoadingTeams(true);
        const response = await fetch(
          `http://localhost:4000/teams/my-teams/${currentUser._id}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch teams: ${response.statusText}`);
        }

        const data = await response.json();
        setTeams(data);
        teamsLoaded.current = true;
      } catch (err) {
        console.error("Error fetching teams:", err);
      } finally {
        setLoadingTeams(false);
      }
    };

    fetchTeams();
  }, [currentUser]);
  const handleSubtasksChanged = async (updatedSubtasks) => {
    try {
      // First update subtasks state
      setSubtasks(updatedSubtasks);

      // Fetch fresh task data to get updated activity logs
      const response = await fetch(
        `http://localhost:4000/tasks/task/${taskId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch updated task details");
      }

      const updatedTask = await response.json();

      const lastActivity =
        updatedTask.activityLog[updatedTask.activityLog.length - 1];

      addNotification({
        type: "subtask",
        message: ` **${lastActivity.action}** in **${task.title}** task`,
        projectId: projectId, // Add project ID
        taskId: updatedTask._id,
        isImportant: lastActivity.priority === "HIGH",
        createdBy: currentUser._id, // Add creator ID
        recipients: [
          projectMembers.map((member) => member._id),
          updatedTask.assignee?.name,
          updatedTask.reporter.mame,
        ].filter(Boolean), // Remove null/undefined values
        timestamp: new Date().toISOString(),
      });
      // Update task state with new data while preserving local changes
      setTask((prevTask) => ({
        ...updatedTask,
        title: prevTask.title,
        description: prevTask.description,
        status: prevTask.status,
        priority: prevTask.priority,
        assignee: prevTask.assignee,
        reporter: prevTask.reporter,
        team: prevTask.team,
        dueDate: prevTask.dueDate,
      }));
    } catch (error) {
      console.error("Error updating task details:", error);
    }
  };
  // Handle task update
  const handleUpdate = async () => {
    try {
      // Prepare update data, handling object references properly
      const updatedTask = {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        // Handle team field - could be object or ID
        team:
          task.team && typeof task.team === "object"
            ? task.team._id
            : task.team,
        // Handle assignee field - could be object or ID
        assignee:
          task.assignee && typeof task.assignee === "object"
            ? task.assignee._id
            : task.assignee,
        // Handle reporter field - could be object or ID
        reporter:
          task.reporter && typeof task.reporter === "object"
            ? task.reporter._id
            : task.reporter,
        // Add userId for activity tracking
        userId: currentUser._id,
        dueDate: task.dueDate,
        subtasks: subtasks,
      };

      // Use the task update endpoint
      const response = await fetch(`http://localhost:4000/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTask),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      const data = await response.json();
      setTask(data);
      const changes = data.activityLog[data.activityLog.length - 1];
      addNotification({
        type: "task",
        message: `
        **${changes.action}** in **${task.title}** task`,
        projectId: projectId, // Add project ID
        taskId: task._id,
        isImportant: updatedTask.priority === "HIGH",
        createdBy: currentUser._id, // Add creator ID
        recipients: [
          projectMembers.map((member) => member._id),
          task.assignee?.name,
          task.assignee,
          task.reporter.name,
        ].filter(Boolean), // Remove null/undefined values

        timestamp: new Date().toISOString(),
      });
      alert("Task updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update task: " + err.message);
    }
  };
  const getAssigneeId = () => {
    if (!task || !task.assignee) return "";
    return typeof task.assignee === "object"
      ? task.assignee._id
      : task.assignee;
  };

  // Helper function to get reporter ID (handling object or string ID)
  const getReporterId = () => {
    if (!task || !task.reporter) return "";
    return typeof task.reporter === "object"
      ? task.reporter._id
      : task.reporter;
  };

  if (loading)
    return <div className="p-6 text-center">Loading task details...</div>;
  if (error)
    return <div className="p-6 text-red-500 text-center">Error: {error}</div>;
  if (!task) return <div className="p-6 text-center">No task found</div>;

  return (
    <div className="flex p-6 max-w-10xl mx-auto">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-blue-500 hover:underline flex items-center mb-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </button>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {task.subTask?.length > 0 && (
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              {task.subTask.filter((s) => s.status === "DONE").length}/
              {task.subTask.length}
            </div>
          )}
        </div>
        <SubtaskList
          taskId={taskId}
          subtasks={subtasks}
          members={projectMembers}
          onSubtasksChanged={handleSubtasksChanged}
        />
        {subtasks.length > 0 && <SubtaskProgress subtasks={subtasks} />}
      </div>

      <div className="flex justify-between items-center mb-6">
        <div></div> {/* Empty div for flex spacing */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main content - left 2/3 */}

        <div className="md:col-span-2 space-y-6 space-x-4">
          <h1 className="text-2xl font-bold text-center">{task.title}</h1>
          <div className="bg-white p-4 rounded-lg shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={task.title || ""}
              onChange={(e) => setTask({ ...task, title: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={task.description || ""}
              onChange={(e) =>
                setTask({ ...task, description: e.target.value })
              }
              className="w-full p-2 border rounded min-h-[150px]"
              placeholder="Add a description..."
            />
          </div>

          {/* Activity Log */}
          {task.activityLog && task.activityLog.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-4">Activity Log</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {task.activityLog.map((log, index) => (
                  <div
                    key={index}
                    className="border-l-2 border-blue-500 pl-3 py-2"
                  >
                    <div className="text-sm">
                      <span className="font-medium">
                        {typeof log.user === "object" ? log.user.name : "User"}
                      </span>{" "}
                      {log.action}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - right 1/3 */}
        <div className="space-y-4 mt-12">
          {/* Status dropdown */}
          <div className="bg-white p-4 rounded-lg shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={task.status || "TO DO"}
              onChange={(e) => setTask({ ...task, status: e.target.value })}
              className="w-full p-2 border rounded"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Priority dropdown */}
          <div className="bg-white p-4 rounded-lg shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={task.priority || "MEDIUM"}
              onChange={(e) => setTask({ ...task, priority: e.target.value })}
              className="w-full p-2 border rounded"
            >
              {priorityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Team selection */}
          <div className="bg-white p-4 rounded-lg shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team
            </label>
            {loadingTeams ? (
              <div className="text-gray-500">Loading teams...</div>
            ) : (
              <select
                value={
                  task.team && typeof task.team === "object"
                    ? task.team._id
                    : task.team || ""
                }
                onChange={(e) => setTask({ ...task, team: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="">No team</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Assignee selection - using shared members data */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Assignee</h3>
            {loadingMembers ? (
              <div className="text-gray-500 border rounded p-2 bg-gray-50">
                Loading project members...
              </div>
            ) : projectMembers.length === 0 ? (
              <div className="text-gray-500 border rounded p-2 bg-gray-50">
                No members available
              </div>
            ) : (
              <select
                value={getAssigneeId()}
                onChange={(e) => setTask({ ...task, assignee: e.target.value })}
                className="w-full p-2 border rounded"
                disabled={loading}
              >
                <option value="">Unassigned</option>
                {projectMembers.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name || "Unknown Member"}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Reporter selection - using shared members data */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Reporter</h3>
            {loadingMembers ? (
              <div className="text-gray-500 border rounded p-2 bg-gray-50">
                Loading project members...
              </div>
            ) : projectMembers.length === 0 ? (
              <div className="text-gray-500 border rounded p-2 bg-gray-50">
                No members available
              </div>
            ) : (
              <select
                value={getReporterId()}
                onChange={(e) => setTask({ ...task, reporter: e.target.value })}
                className="w-full p-2 border rounded"
                disabled={loading}
              >
                <option value="">None</option>
                {projectMembers.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name || "Unknown Member"}
                  </option>
                ))}
              </select>
            )}
          </div>
          {/* Due date */}
          <div className="bg-white p-4 rounded-lg shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={task.dueDate ? task.dueDate.slice(0, 10) : ""}
              onChange={(e) => setTask({ ...task, dueDate: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* File Upload */}
          <FileUpload
            taskId={taskId}
            onFileUploaded={(updatedTask) => setTask(updatedTask)}
          />
          {/* Update button */}
          <button
            onClick={handleUpdate}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Update Task
          </button>
        </div>
      </div>
    </div>
  );
};
