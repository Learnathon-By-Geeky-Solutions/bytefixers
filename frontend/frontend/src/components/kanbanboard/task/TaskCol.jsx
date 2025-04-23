import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../../context/NotificationContext";
export const TaskCol = ({
  title,
  tasks,
  status,
  handleAddTask,
  handleDelete,
  setActiveTask,
  onDrop,
  icon,
  projectId,
}) => {
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [taskText, setTaskText] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const handleTaskClick = (taskId) => {
    navigate(`/project/${projectId}/task/${taskId}`);
  };
  // Handle task submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!taskText.trim()) return;

    try {
      await handleAddTask(status, taskText);
      addNotification({
        message: `New task "${taskText}" created in ${status}`,
        type: "success",
      });
      setTaskText("");
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  // Handle drag start
  const handleDragStart = (e, taskId) => {
    setActiveTask({ taskId, status });
    // Set data for HTML5 drag and drop
    e.dataTransfer.setData("taskId", taskId);
  };

  // Handle dragover event to allow dropping
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    onDrop(status, taskId);
  };

  return (
    <div
      className="bg-gray-100 rounded-lg p-3 min-w-[280px] h-fit"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-700 flex items-center">
          <span className="mr-2">{icon}</span> {title}
          <span className="ml-2 text-gray-500 text-sm">({tasks.length})</span>
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-blue-500 hover:text-blue-700"
        >
          {showAddForm ? "Cancel" : "+ Add"}
        </button>
      </div>

      {/* Add task form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-3">
          <input
            type="text"
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            placeholder="Enter task title..."
            className="w-full p-2 border rounded mb-2"
            autoFocus
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Add Task
          </button>
        </form>
      )}

      {/* Tasks list */}
      <div className="space-y-2">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task._id}
              draggable
              onDragStart={(e) => handleDragStart(e, task._id)}
              onClick={() => handleTaskClick(task._id)}
              className="bg-white p-3 rounded shadow cursor-grab hover:shadow-md"
            >
              <div className="flex justify-between">
                <h4 className="font-medium">{task.title}</h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(task._id);
                  }}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  &times;
                </button>
              </div>

              {task.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}

              <div className="flex justify-between items-center mt-2">
                <span
                  className={`text-xs px-2 py-1 rounded ${getPriorityColor(
                    task.priority
                  )}`}
                >
                  {task.priority}
                </span>
                <span className="text-xs text-gray-500">
                  {task.assignee ? task.assignee.name : "Unassigned"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-400">No tasks yet</div>
        )}
      </div>
    </div>
  );
};

// Helper function for priority colors
function getPriorityColor(priority) {
  switch (priority) {
    case "LOW":
      return "bg-green-100 text-green-800";
    case "MEDIUM":
      return "bg-blue-100 text-blue-800";
    case "HIGH":
      return "bg-orange-100 text-orange-800";
    case "CRITICAL":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
