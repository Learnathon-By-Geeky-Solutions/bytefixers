import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import { useMembers } from "../../context/MembersContext";
import { authServices } from "../../auth";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Define status colors for consistency
const statusColors = {
  BACKLOG: "#6c757d", // Gray
  "TO DO": "#0d6efd", // Blue
  "IN PROGRESS": "#ffc107", // Yellow/Amber
  REVIEW: "#6f42c1", // Purple
  DONE: "#198754", // Green
};

// Define priority colors
const priorityColors = {
  LOW: "#28a745", // Green
  MEDIUM: "#0d6efd", // Blue
  HIGH: "#fd7e14", // Orange
  CRITICAL: "#dc3545", // Red
};

export const PersonalTaskStats = () => {
  // Get data from MembersContext
  const { allTasks, projects, loading, error } = useMembers();

  // Get current user
  const currentUser = authServices.getAuthUser();

  // Local state
  const [userTasks, setUserTasks] = useState([]);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    byStatus: {
      BACKLOG: [],
      "TO DO": [],
      "IN PROGRESS": [],
      REVIEW: [],
      DONE: [],
    },
    byPriority: {
      LOW: [],
      MEDIUM: [],
      HIGH: [],
      CRITICAL: [],
    },
    upcomingDeadlines: [],
    overdueTasks: [],
    byProject: {},
  });

  // Use ref to track if we've processed
  const hasProcessedRef = useRef(false);

  // Extract and filter tasks when data changes
  useEffect(() => {
    // Skip if data isn't available yet
    if (!allTasks || !currentUser || !projects || allTasks.length === 0) {
      return;
    }

    // Skip if we've already processed this exact data
    if (hasProcessedRef.current) {
      return;
    }

    console.log("Processing tasks for current user:", currentUser._id);

    try {
      // Extract all tasks from the nested structure
      const allExtractedTasks = [];

      // Iterate over all items in allTasks
      allTasks.forEach((item) => {
        // Check if the item has a valid tasks array
        if (item && Array.isArray(item.tasks)) {
          // Map over the tasks inside each item
          const tasksWithProjectInfo = item.tasks.map((task) => {
            // Find the project matching the task's project ID (or other logic)
            console.log("Task", task);
            const project = projects.find((project) => {
              console.log("Checking project:", project.name);

              const foundTask = project.task.some((projectTask) => {
                console.log(
                  "Comparing project task:",
                  projectTask,
                  "with task _id:",
                  task._id
                );
                return projectTask === task._id;
              });

              if (foundTask) {
                console.log("Matching task found in project:", project.name);
              }
              return foundTask;
            });

            // If a matching project is found, enrich the task with project info
            if (project) {
              return {
                ...task, // Include original task data
                projectInfo: {
                  _id: project._id || "unknown",
                  title: project.title || project.name || "Unknown Project",
                },
              };
            }

            // If no matching project is found, just return the task with project info
            return {
              ...task,
              projectInfo: {
                _id: "unknown",
                title: "Unknown Project",
              },
            };
          });

          // Add the enriched tasks to the allExtractedTasks array
          allExtractedTasks.push(...tasksWithProjectInfo);
        }
      });

      console.log(allExtractedTasks);

      // Second attempt: If tasks aren't nested, process as a flat array
      if (allExtractedTasks.length === 0) {
        // Assume allTasks is itself a flat array of tasks
        allTasks.forEach((task) => {
          if (task && typeof task === "object" && task._id) {
            // For each task, try to find which project it belongs to
            let projectMatch = null;

            for (const project of projects) {
              if (project.tasks && Array.isArray(project.tasks)) {
                // Check if this task's ID is in the project's tasks array
                const taskIds = project.tasks.map((t) =>
                  typeof t === "string" ? t : t?._id || ""
                );

                if (taskIds.includes(task._id)) {
                  projectMatch = project;
                  console.log(projectMatch);
                  break;
                }
              }
            }

            // Add project info to the task
            allExtractedTasks.push({
              ...task,
              projectInfo: projectMatch
                ? {
                    _id: projectMatch._id,
                    title: projectMatch.title || projectMatch.name || "Project",
                  }
                : {
                    _id: "unknown",
                    title: "Unknown Project",
                  },
            });
          }
        });
      }

      console.log(`Extracted ${allExtractedTasks.length} total tasks`);

      // If still no tasks found, use a fallback approach
      if (allExtractedTasks.length === 0 && Array.isArray(allTasks)) {
        console.log("Using fallback approach to extract tasks");

        // Create a mapping of all tasks by ID
        const allTasksById = {};
        allTasks.forEach((task) => {
          if (task && task._id) {
            allTasksById[task._id] = {
              ...task,
              projectInfo: { _id: "unknown", title: "Unknown Project" },
            };
          }
        });

        // Go through projects and assign project info to tasks
        projects.forEach((project) => {
          if (project && project._id) {
            // Check if this project has tasks
            const projectTaskIds = [];

            // Case 1: project has a tasks array
            if (project.tasks && Array.isArray(project.tasks)) {
              project.tasks.forEach((taskRef) => {
                const taskId =
                  typeof taskRef === "string" ? taskRef : taskRef?._id;
                if (taskId) projectTaskIds.push(taskId);
              });
            }

            // Associate tasks with this project
            projectTaskIds.forEach((taskId) => {
              if (allTasksById[taskId]) {
                allTasksById[taskId].projectInfo = {
                  _id: project._id,
                  title: project.title || project.name || "Project",
                };
              }
            });
            console.log("ProjectTaskIds", projectTaskIds);
          }
        });

        // Convert back to array
        Object.values(allTasksById).forEach((task) => {
          allExtractedTasks.push(task);
        });
      }
      console.log("Extracted tasks using fallback approach", allExtractedTasks);

      // Filter tasks assigned to current user with enhanced matching
      const tasksForCurrentUser = allExtractedTasks.filter((task) => {
        if (!task) return false;

        // Check multiple fields where user ID could be stored
        return (
          // Direct assignee match (string ID)
          task.assignee === currentUser._id ||
          // Assignee as object
          (task.assignee &&
            typeof task.assignee === "object" &&
            task.assignee._id === currentUser._id) ||
          // Check assignees array
          (Array.isArray(task.assignees) &&
            task.assignees.some(
              (a) =>
                (typeof a === "string" && a === currentUser._id) ||
                (typeof a === "object" && a._id === currentUser._id)
            )) ||
          // Check reporter field
          task.reporter === currentUser._id ||
          (task.reporter &&
            typeof task.reporter === "object" &&
            task.reporter._id === currentUser._id) ||
          // Last resort - check if user is in the project's members
          (task.projectInfo &&
            task.projectInfo._id !== "unknown" &&
            projects.some(
              (p) =>
                p._id === task.projectInfo._id &&
                p.members &&
                Array.isArray(p.members) &&
                p.members.some(
                  (m) =>
                    (typeof m === "string" && m === currentUser._id) ||
                    (typeof m === "object" && m._id === currentUser._id)
                )
            ))
        );
      });

      console.log(`Found ${tasksForCurrentUser.length} tasks for current user`);

      // If empty after all attempts, log some diagnostics
      if (tasksForCurrentUser.length === 0) {
        console.log("No tasks found for current user. Diagnostic info:");
        console.log("Current user ID:", currentUser._id);
        console.log("Sample tasks:", allExtractedTasks.slice(0, 2));

        // Show project membership
        projects.forEach((project) => {
          if (project.members) {
            const memberIds = project.members.map((m) =>
              typeof m === "object" ? m._id : m
            );
            console.log(`Project ${project._id} members:`, memberIds);
          }
        });
      }

      // Update userTasks
      setUserTasks(tasksForCurrentUser);

      // If no tasks found for user
      if (tasksForCurrentUser.length === 0) {
        hasProcessedRef.current = true;
        return;
      }

      // Calculate task statistics
      const byStatus = {
        BACKLOG: tasksForCurrentUser.filter(
          (task) => task.status === "BACKLOG"
        ),
        "TO DO": tasksForCurrentUser.filter((task) => task.status === "TO DO"),
        "IN PROGRESS": tasksForCurrentUser.filter(
          (task) => task.status === "IN PROGRESS"
        ),
        REVIEW: tasksForCurrentUser.filter((task) => task.status === "REVIEW"),
        DONE: tasksForCurrentUser.filter((task) => task.status === "DONE"),
      };

      // Tasks by priority
      const byPriority = {
        LOW: tasksForCurrentUser.filter((task) => task.priority === "LOW"),
        MEDIUM: tasksForCurrentUser.filter(
          (task) => task.priority === "MEDIUM"
        ),
        HIGH: tasksForCurrentUser.filter((task) => task.priority === "HIGH"),
        CRITICAL: tasksForCurrentUser.filter(
          (task) => task.priority === "CRITICAL"
        ),
      };

      // Calculate upcoming deadlines (next 7 days)
      const today = new Date();
      const upcomingDeadlines = tasksForCurrentUser
        .filter((task) => task.status !== "DONE" && task.dueDate)
        .filter((task) => {
          try {
            const dueDate = new Date(task.dueDate);
            const diffTime = dueDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            console.log("Diff days", diffDays);
            return diffDays >= 0 && diffDays <= 7;
          } catch (err) {
            return false;
          }
        })
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

      // Calculate overdue tasks
      const overdueTasks = tasksForCurrentUser
        .filter((task) => task.status !== "DONE" && task.dueDate)
        .filter((task) => {
          try {
            const dueDate = new Date(task.dueDate);
            return dueDate < today;
          } catch (err) {
            return false;
          }
        })
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

      // Group by project
      const byProject = {};
      tasksForCurrentUser.forEach((task) => {
        console.log("Task for me", task);
        console.log("Task assignee", task.assignee);
        console.log("Current user ID", currentUser._id);
        if (task.projectInfo) {
          const projectId = task.projectInfo._id;
          if (!byProject[projectId]) {
            byProject[projectId] = {
              project: task.projectInfo,
              tasks: [],
            };
          }
          byProject[projectId].tasks.push(task);
        }
      });

      // Set all stats at once
      setTaskStats({
        total: tasksForCurrentUser.length,
        byStatus,
        byPriority,
        byProject,
        upcomingDeadlines,
        overdueTasks,
      });

      // Mark as processed
      hasProcessedRef.current = true;
    } catch (err) {
      console.error("Error processing tasks:", err);
    }
  }, [allTasks, projects, currentUser]);

  // Reset processing flag when dependencies change
  useEffect(() => {
    if (allTasks && allTasks.length > 0) {
      hasProcessedRef.current = false;
    }
  }, [allTasks]);

  // Prepare chart data for status
  const statusChartData = {
    labels: Object.keys(taskStats.byStatus),
    datasets: [
      {
        data: Object.values(taskStats.byStatus).map((arr) => arr.length),
        backgroundColor: Object.keys(taskStats.byStatus).map(
          (status) => statusColors[status]
        ),
        borderWidth: 1,
      },
    ],
  };

  // Prepare chart data for priority
  const priorityChartData = {
    labels: Object.keys(taskStats.byPriority),
    datasets: [
      {
        data: Object.values(taskStats.byPriority).map((arr) => arr.length),
        backgroundColor: Object.keys(taskStats.byPriority).map(
          (priority) => priorityColors[priority]
        ),
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
      },
    },
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-3"></div>
          <p className="text-gray-500">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <p className="mb-2">Error loading dashboard: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  // No tasks state
  if (!loading && userTasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl mb-4">My Tasks</h2>
        <p className="text-gray-500">
          You don't have any tasks assigned to you.
        </p>
        <button
          onClick={() => {
            // Reset processing flag and reload
            hasProcessedRef.current = false;
            window.location.reload();
          }}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh Dashboard
        </button>
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Tasks</div>
          <div className="text-2xl font-bold">{taskStats.total}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">To Do</div>
          <div className="text-2xl font-bold">
            {taskStats.byStatus["TO DO"]?.length || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">In Progress</div>
          <div className="text-2xl font-bold">
            {taskStats.byStatus["IN PROGRESS"]?.length || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Done</div>
          <div className="text-2xl font-bold">
            {taskStats.byStatus["DONE"]?.length || 0}
          </div>
        </div>
      </div>

      {/* Charts and Upcoming Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-medium mb-4">Task Status Distribution</h2>
          <div className="h-64">
            <Pie data={statusChartData} options={chartOptions} />
          </div>
        </div>

        {/* Priority Distribution Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-medium mb-4">
            Task Priority Distribution
          </h2>
          <div className="h-64">
            <Pie data={priorityChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-medium mb-4">Upcoming Deadlines</h2>
        {!taskStats.upcomingDeadlines?.length ? (
          <div className="text-center py-4 text-gray-500">
            No upcoming deadlines
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto max-h-[250px]">
            {taskStats.upcomingDeadlines?.map((task) => (
              <div
                key={task._id}
                className="border-l-2 border-yellow-400 pl-3 py-1"
              >
                <div className="font-medium">{task.title}</div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                  <span
                    className={`${
                      task.priority === "CRITICAL"
                        ? "bg-red-100 text-red-800"
                        : task.priority === "HIGH"
                        ? "bg-orange-100 text-orange-800"
                        : task.priority === "MEDIUM"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    } px-2 py-0.5 text-xs rounded-full`}
                  >
                    {task.priority || "Low"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Projects section */}
      {Object.keys(taskStats.byProject).length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-medium mb-4">My Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(taskStats.byProject).map(({ project, tasks }) => (
              <Link
                key={project._id}
                to={`../projects/${project._id}`}
                className="block border rounded-lg p-4 hover:bg-gray-50"
              >
                <h4 className="font-medium">{project.title}</h4>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-500">
                    {tasks.length} tasks
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      tasks.filter((t) => t.status === "DONE").length ===
                      tasks.length
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {tasks.filter((t) => t.status === "DONE").length}/
                    {tasks.length} done
                  </span>
                </div>

                {/* Mini progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{
                      width:
                        tasks.length > 0
                          ? `${Math.round(
                              (tasks.filter((t) => t.status === "DONE").length /
                                tasks.length) *
                                100
                            )}%`
                          : "0%",
                    }}
                  ></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Overdue tasks */}
      {taskStats.overdueTasks?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-medium mb-4 flex items-center">
            Overdue Tasks
            <span className="ml-2 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
              {taskStats.overdueTasks.length}
            </span>
          </h2>
          <div className="space-y-3 overflow-y-auto max-h-[200px]">
            {taskStats.overdueTasks.map((task) => {
              const daysOverdue = Math.abs(
                Math.round(
                  (new Date() - new Date(task.dueDate)) / (1000 * 60 * 60 * 24)
                )
              );
              return (
                <div
                  key={task._id}
                  className="border-l-2 border-red-400 pl-3 py-1"
                >
                  <div className="font-medium">{task.title}</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-500">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                      <span className="ml-2 text-xs bg-red-50 px-1 rounded">
                        {daysOverdue} {daysOverdue === 1 ? "day" : "days"}{" "}
                        overdue
                      </span>
                    </span>
                    <span
                      className={`${
                        task.priority === "CRITICAL"
                          ? "bg-red-100 text-red-800"
                          : task.priority === "HIGH"
                          ? "bg-orange-100 text-orange-800"
                          : task.priority === "MEDIUM"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      } px-2 py-0.5 text-xs rounded-full`}
                    >
                      {task.priority || "Low"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
