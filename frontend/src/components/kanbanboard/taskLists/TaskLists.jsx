import React, { useEffect, useState } from "react";
import Sidebar from "../../Board/sidebar/sidebar.jsx";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import { useParams } from "react-router-dom";
import { format, addDays } from "date-fns";

export const TaskLists = () => {
  const [project, setProject] = useState(null); // Store project data
  const [members, setMembers] = useState([]); // Store members of the project
  const [userDetails, setUserDetails] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [expandedTask, setExpandedTask] = useState({});
  const [error, setError] = useState(null); // State to store error messages
  const { projectid } = useParams(); // Replace with actual project ID
  console.log("In TaskList", projectid);
  const [loadingSubtasks, setLoadingSubtasks] = useState({});
  // Add these after your existing state declarations
  const [filters, setFilters] = useState({
    priority: "",
    status: "",
    dueDate: "",
  });

  // Add filter options
  const filterOptions = {
    priority: ["HIGH", "MEDIUM", "LOW", "CRITICAL"],
    status: ["TO DO", "IN PROGRESS", "REVIEW", "DONE"],
    dueDate: ["Today", "This Week", "This Month", "Overdue"],
  };

  // Add filter handler
  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  // Add filtered tasks logic
  const getFilteredTasks = () => {
    return tasks.filter((task) => {
      // Priority filter
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }

      // Status filter
      if (filters.status && task.status !== filters.status) {
        return false;
      }

      // Due date filter
      if (filters.dueDate) {
        const today = new Date();
        const dueDate = new Date(task.dueDate);

        switch (filters.dueDate) {
          case "Today":
            if (format(dueDate, "yyyy-MM-dd") !== format(today, "yyyy-MM-dd")) {
              return false;
            }
            break;
          case "This Week":
            const weekEnd = addDays(today, 7);
            if (dueDate < today || dueDate > weekEnd) {
              return false;
            }
            break;
          case "This Month":
            if (format(dueDate, "yyyy-MM") !== format(today, "yyyy-MM")) {
              return false;
            }
            break;
          case "Overdue":
            if (dueDate >= today) {
              return false;
            }
            break;
          default:
            break;
        }
      }

      return true;
    });
  };
  useEffect(() => {
    // Fetch tasks when component mounts
    const fetchTasks = async () => {
      try {
        const response = await fetch(
          `http://localhost:4000/projects/${projectid}/tasks`
        );
        const data = await response.json();
        setTasks(Array.isArray(data.tasks) ? data.tasks : []);
        if (data.subTask) {
          setSubtasks(data.subTask);
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
        // setTasks([]); // ✅ Avoid undefined state
      }
    };
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
    fetchProjectDetails();
    fetchTasks();
  }, [projectid]);

  const toggleSubtasks = async (taskId) => {
    setExpandedTask((prev) => {
      const isExpanding = !prev[taskId];
      if (
        isExpanding &&
        !tasks.find((t) => t._id === taskId)?.subTask?.length
      ) {
        fetchSubtasks(taskId);
      }
      return { ...prev, [taskId]: isExpanding };
    });
  };

  const fetchSubtasks = async (taskId) => {
    try {
      setLoadingSubtasks((prev) => ({ ...prev, [taskId]: true }));
      console.log("Fetching subtasks for task:", taskId);
      const response = await fetch(
        `http://localhost:4000/tasks/${taskId}/subtasks`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch subtasks");
      }

      const data = await response.json();
      console.log("Task data with subtasks:", data);

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === taskId
            ? {
                ...task,
                subTask: data.subtaskDetails || [], // Use subtaskDetails from response
              }
            : task
        )
      );
    } catch (error) {
      console.error("Error fetching subtasks:", error);
      alert("Failed to load subtasks");
    } finally {
      setLoadingSubtasks((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="w-full p-4 mt-10">
        <div className="overflow-x-auto">
          <div className="mb-4 flex gap-4 bg-white p-4 rounded-lg shadow">
            {/* Priority Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              >
                <option value="">All Priorities</option>
                {filterOptions.priority.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              >
                <option value="">All Statuses</option>
                {filterOptions.status.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <select
                value={filters.dueDate}
                onChange={(e) => handleFilterChange("dueDate", e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              >
                <option value="">All Dates</option>
                {filterOptions.dueDate.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                onClick={() =>
                  setFilters({ priority: "", status: "", dueDate: "" })
                }
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
          <table className="min-w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr className="text-left">
                <th className="border p-2"></th>
                <th className="border p-2">Type</th>
                <th className="border p-2">Summary</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Priority</th>
                <th className="border p-2">Assignee</th>
                <th className="border p-2">Due Date</th>
                <th className="border p-2">Created</th>
                <th className="border p-2">Updated</th>
                <th className="border p-2">Reporter</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredTasks().length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-8 text-gray-500">
                    No tasks match the selected filters
                  </td>
                </tr>
              ) : (
                getFilteredTasks().map((task) => (
                  <React.Fragment key={task._id}>
                    {console.log("Length: ", task.subTask.length)}
                    {/* Task Row */}
                    <tr className="hover:bg-gray-50">
                      <td className="border p-2">
                        {task.subTask && task.subTask.length > 0 && (
                          <button onClick={() => toggleSubtasks(task._id)}>
                            {expandedTask[task._id] ? (
                              <FaChevronDown className="text-gray-600" />
                            ) : (
                              <FaChevronRight className="text-gray-600" />
                            )}
                          </button>
                        )}
                      </td>
                      <td className="border p-2">{task.title}</td>
                      <td className="">{task.description}</td>
                      <td className="border p-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            task.status === "DONE"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {task.status}
                        </span>
                      </td>
                      <td className="border p-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            task.priority === "HIGH"
                              ? "bg-orange-100 text-orange-800"
                              : task.priority === "MEDIUM"
                              ? "bg-blue-100 text-blue-800"
                              : task.priority === "LOW"
                              ? "bg-green-100 text-green-800"
                              : task.priority === "CRITICAL"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="border p-2">
                        {console.log("Assignee: ", task.assignee)}
                        {console.log("User Details: ", userDetails)}
                        {task.assignee
                          ? userDetails.find(
                              (user) => user._id === task.assignee._id
                            )?.name
                          : "Unassigned"}{" "}
                        {/* Display assignee's name or the logged-in user's name */}
                      </td>
                      <td className="border p-2">
                        {format(new Date(task.dueDate || null), "PPP p")}
                      </td>
                      <td className="border p-2">
                        {format(new Date(task.createdAt), "PPP p")}
                      </td>
                      <td className="border p-2">
                        {format(new Date(task.updatedAt), "PPP p")}
                      </td>
                      <td className="border p-2">
                        {task.reporter
                          ? userDetails.find(
                              (user) => user._id === task.reporter._id
                            )?.name
                          : "Unknown User"}{" "}
                        {/* Display assignee's name or the logged-in user's name */}
                      </td>
                    </tr>

                    {/* Subtasks */}
                    {/* Subtasks */}
                    {console.log("SubTask in task list: ", task)}
                    {expandedTask[task._id] && (
                      <>
                        {loadingSubtasks[task._id] ? (
                          <tr>
                            <td colSpan="10" className="text-center p-4">
                              <div className="flex justify-center items-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                <span className="ml-2">
                                  Loading subtasks...
                                </span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          task.subTask &&
                          task.subTask.map((subtask) => (
                            <tr
                              key={subtask._id}
                              className="hover:bg-gray-50 bg-gray-50"
                            >
                              <td className="border p-2">
                                <span className="text-xs text-gray-500">
                                  └─
                                </span>
                                Subtask
                              </td>
                              <td className="border p-2">{subtask.title}</td>
                              <td className="border p-2">
                                {subtask.description}
                              </td>
                              <td className="border p-2">
                                <span
                                  className={`px-2 py-1 text-xs font-semibold rounded ${
                                    subtask.status === "DONE"
                                      ? "bg-green-100 text-green-700"
                                      : subtask.status === "IN PROGRESS"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-gray-200 text-gray-700"
                                  }`}
                                >
                                  {subtask.status}
                                </span>
                              </td>
                              <td className="border p-2">
                                <span
                                  className={`px-2 py-1 text-xs font-semibold rounded ${
                                    subtask.priority === "HIGH"
                                      ? "bg-orange-100 text-orange-800"
                                      : subtask.priority === "MEDIUM"
                                      ? "bg-blue-100 text-blue-800"
                                      : subtask.priority === "LOW"
                                      ? "bg-green-100 text-green-800"
                                      : subtask.priority === "CRITICAL"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {subtask.priority}
                                </span>
                              </td>
                              <td className="border p-2">
                                {subtask.assignee?.name || "Unassigned"}
                              </td>
                              <td className="border p-2">
                                {format(
                                  new Date(subtask.dueDate || null),
                                  "PPP p"
                                )}
                              </td>
                              <td className="border p-2">
                                {format(new Date(subtask.createdAt), "PPP p")}
                              </td>
                              <td className="border p-2">
                                {format(new Date(subtask.updatedAt), "PPP p")}
                              </td>
                              <td className="border p-2">
                                {subtask.reporter?.name || "Unknown"}
                              </td>
                            </tr>
                          ))
                        )}
                      </>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
