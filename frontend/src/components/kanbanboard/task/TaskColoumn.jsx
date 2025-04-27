import React, { useEffect, useState } from "react";
import { TaskCol } from "./TaskCol";
import ToDo from "../../../assets/images/to-do-list.png";
import InProgress from "../../../assets/images/in-progress.png";
import Done from "../../../assets/images/done.png";
import { useParams } from "react-router-dom";
import { authServices } from "../../../auth";
import { useNotifications } from "../../../context/NotificationContext";
import { useMembers } from "../../../context/MembersContext";
import propTypes from "prop-types";
export const TaskColoumn = ({ projectId }) => {
  const { addNotification } = useNotifications();
  // const { projectId } = useParams();
  const { members: projectMembers, loading: loadingMembers } = useMembers();
  const initialData = JSON.parse(localStorage.getItem("tasks")) || {
    todo: [],
    inProgress: [],
    done: [],
  };
  const defaultStatuses = ["TO DO", "IN PROGRESS", "DONE"];
  // All possible statuses in workflow order
  const allPossibleStatuses = [
    "BACKLOG",
    "TO DO",
    "IN PROGRESS",
    "REVIEW",
    "DONE",
  ];
  const [activeColumns, setActiveColumns] = useState(defaultStatuses);
  const [tasks, setTasks] = useState(initialData);
  const [activeTask, setActiveTask] = useState({ index: null, stat: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUser = authServices.getAuthUser();
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        if (!projectId) {
          console.error("No project ID available");
          setError("No project ID available");
          setLoading(false);
          return;
        }
        const response = await fetch(
          `http://localhost:4000/tasks/${projectId}`
        );

        if (!response.ok) {
          throw new Error(`Error fetching tasks: ${response.statusText}`);
        }

        const data = await response.json();
        setTasks(data);
        updateActiveColumns(data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        setError(error.message);
        setLoading(false);
      }
    };

    if (projectId) {
      fetchTasks();
    }
  }, [projectId]);
  // Update local storage when tasks change
  useEffect(() => {
    if (tasks.length > 0) {
      // Group tasks by status
      const tasksByStatus = {};
      tasks.forEach((task) => {
        if (!tasksByStatus[task.status]) {
          tasksByStatus[task.status] = [];
        }
        tasksByStatus[task.status].push(task);
      });

      localStorage.setItem("tasks", JSON.stringify(tasksByStatus));
    }
  }, [tasks]);
  const handleAddTask = async (status, taskText) => {
    try {
      // Create basic task data
      const newTask = {
        title: taskText,
        description: "",
        status: status,
        priority: "MEDIUM",
        team: null,
        assignee: null,
        reporter: authServices.getAuthUser()?._id || null,
      };

      const response = await fetch(
        `http://localhost:4000/tasks/${projectId}/addTasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newTask),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create task");
      }

      // Add the new task to state
      setTasks((prev) => [...prev, data]);

      // Check if we need to add a new column
      if (!activeColumns.includes(status)) {
        const newActiveColumns = [...activeColumns, status];
        newActiveColumns.sort(
          (a, b) =>
            allPossibleStatuses.indexOf(a) - allPossibleStatuses.indexOf(b)
        );
        setActiveColumns(newActiveColumns);
      }

      // Create notification for new task
      try {
        // Only send notification if we have the necessary data
        if (data && data._id) {
          addNotification({
            type: "task",
            message: `New task **${data.title}** created in **${status}**`,
            projectId: projectId,
            taskId: data._id,
            isImportant: data.priority === "HIGH",
            createdBy: currentUser?._id,
            recipients: projectMembers
              ?.map((member) => member._id)
              .filter(Boolean),
            timestamp: new Date().toISOString(),
          });
        }
      } catch (notificationError) {
        console.error("Error sending notification:", notificationError);
        // Don't throw here - just log the error since notification is not critical
      }

      // return data;
    } catch (error) {
      console.error("Error adding task:", error);
      throw error;
    }
  };
  const updateActiveColumns = (currentTasks) => {
    // Always include default columns
    const uniqueStatuses = new Set(defaultStatuses);

    // Add any non-default statuses that have tasks
    currentTasks.forEach((task) => {
      if (task.status && !uniqueStatuses.has(task.status)) {
        uniqueStatuses.add(task.status);
      }
    });

    // Sort columns according to workflow order
    const sortedColumns = allPossibleStatuses.filter((status) =>
      uniqueStatuses.has(status)
    );

    setActiveColumns(sortedColumns);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const response = await fetch(`http://localhost:4000/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      // Remove the task from state
      const updatedTasks = tasks.filter((task) => task._id !== taskId);
      setTasks(updatedTasks);

      // Check if we need to remove any columns (if no tasks remain with that status)
      updateActiveColumns(updatedTasks);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };
  const onDrop = async (targetStatus, draggedTaskId) => {
    if (!draggedTaskId) return;

    try {
      // Find the task in state
      const taskToUpdate = tasks.find((task) => task._id === draggedTaskId);
      if (!taskToUpdate) return;

      // Skip if status hasn't changed
      if (taskToUpdate.status === targetStatus) return;
      const updatedTask = {
        status: targetStatus,
        // Include userId for activity logging
        userId: currentUser._id,
      };
      // Create updated task object
      const response = await fetch(
        `http://localhost:4000/tasks/${draggedTaskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedTask),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update task status");
      }

      const result = await response.json();

      // Update task in state
      setTasks((prev) =>
        prev.map((task) => (task._id === draggedTaskId ? result : task))
      );

      setActiveTask({ index: null, stat: null });
      //add notification
      const changes = result.activityLog[result.activityLog.length - 1];
      addNotification({
        type: "task",
        message: `
        **${changes.action}** in **${result.title}** task`,
        projectId: projectId, // Add project ID
        taskId: updatedTask._id,
        isImportant: updatedTask.priority === "HIGH",
        createdBy: currentUser._id, // Add creator ID
        recipients: [
          projectMembers.map((member) => member._id),
          result.assignee?.name,
          result.assignee,
          result.reporter.name,
        ].filter(Boolean), // Remove null/undefined values

        timestamp: new Date().toISOString(),
      });
      alert("Task status updated successfully!");
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };
  if (loading) return <div className="text-center py-10">Loading tasks...</div>;
  if (error)
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 gap-6 md:flex md:space-x-4 overflow-x-auto pb-6">
        {activeColumns.map((status) => (
          <TaskCol
            key={status}
            title={status}
            tasks={tasks.filter((task) => task.status === status)}
            status={status}
            handleAddTask={handleAddTask}
            handleDelete={handleDeleteTask}
            setActiveTask={setActiveTask}
            onDrop={onDrop}
            icon={getStatusIcon(status)}
            projectId={projectId}
          />
        ))}
      </div>
    </div>
  );
};
function getStatusIcon(status) {
  switch (status) {
    case "BACKLOG":
      return "📋"; // Clipboard icon
    case "TO DO":
      return "📝"; // Memo icon
    case "IN PROGRESS":
      return "⚙️"; // Gear icon
    case "REVIEW":
      return "🔍"; // Magnifying glass icon
    case "DONE":
      return "✅"; // Checkmark icon
    default:
      return "📄"; // Document icon
  }
}
TaskColoumn.propTypes = {
  projectId: propTypes.string.isRequired,
};
