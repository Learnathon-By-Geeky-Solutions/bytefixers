import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { authServices } from "../../../auth";
import PropTypes from "prop-types";
export const SubtaskItem = ({ subtask, members, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubtask, setEditedSubtask] = useState({ ...subtask });
  const [updating, setUpdating] = useState(false);
  const statusOptions = ["BACKLOG", "TO DO", "IN PROGRESS", "REVIEW", "DONE"];
  const priorityOptions = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedSubtask((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      await onUpdate(subtask._id, editedSubtask);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update subtask:", error);
      alert("Failed to update subtask");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditedSubtask({ ...subtask });
    setIsEditing(false);
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "DONE":
        return "bg-green-100 text-green-800";
      case "IN PROGRESS":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format date or return empty string if null
  const formatDate = (date) => {
    if (!date) return "";
    try {
      return format(new Date(date), "PP");
    } catch (e) {
      console.error("Error formatting date:", e);
      return "";
    }
  };

  const getAssigneeName = () => {
    if (!subtask.assignee) return "Unassigned";
    return typeof subtask.assignee === "object" && subtask.assignee.name
      ? subtask.assignee.name
      : "Unknown";
  };
  const getReporterName = () => {
    if (!subtask.reporter) return authServices.getAuthUser().name;
    return typeof subtask.reporter === "object" && subtask.reporter.name
      ? subtask.reporter.name
      : "Unknown";
  };

  return (
    <div className="border rounded-md p-3 mb-2 hover:bg-gray-50">
      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <div className="block text-sm font-medium text-gray-700">Title</div>
            <input
              type="text"
              name="title"
              value={editedSubtask.title || ""}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
              required
            />
          </div>

          <div>
            <div className="block text-sm font-medium text-gray-700">
              Description
            </div>
            <textarea
              name="description"
              value={editedSubtask.description || ""}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
              rows="2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="block text-sm font-medium text-gray-700">
                Status
              </div>
              <select
                name="status"
                value={editedSubtask.status || "TO DO"}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-700">
                Priority
              </div>
              <select
                name="priority"
                value={editedSubtask.priority || "LOW"}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
              >
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="block text-sm font-medium text-gray-700">
                Assignee
              </div>
              <select
                name="assignee"
                value={
                  editedSubtask.assignee?._id || editedSubtask.assignee || ""
                }
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-700">
                Reporter
              </div>
              <select
                name="reporter"
                value={
                  editedSubtask.reporter?._id || editedSubtask.reporter || ""
                }
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
              >
                {/* <option value="">Unassigned</option> */}
                {members.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="block text-sm font-medium text-gray-700">
                Due Date
              </div>
              <input
                type="date"
                name="dueDate"
                value={
                  editedSubtask.dueDate
                    ? new Date(editedSubtask.dueDate)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
              disabled={updating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
              disabled={updating}
            >
              {updating ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      ) : (
        <div>
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={subtask.status === "DONE"}
                onChange={() => {
                  onUpdate(subtask._id, {
                    ...subtask,
                    status: subtask.status === "DONE" ? "TO DO" : "DONE",
                  });
                }}
                className="mr-2 h-4 w-4 rounded"
              />
              <h4
                className={`font-medium ${
                  subtask.status === "DONE" ? "line-through text-gray-500" : ""
                }`}
              >
                {subtask.title}
              </h4>
            </div>

            <div className="flex space-x-1">
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-400 hover:text-blue-500"
                title="Edit subtask"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={() => onDelete(subtask._id)}
                className="text-gray-400 hover:text-red-500"
                title="Delete subtask"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {subtask.description && (
            <p className="text-sm text-gray-600 mt-1 ml-6">
              {subtask.description}
            </p>
          )}

          <div className="mt-2 ml-6 flex flex-wrap items-center text-xs gap-2">
            <span
              className={`px-2 py-1 rounded ${getStatusColor(subtask.status)}`}
            >
              {subtask.status}
            </span>

            {subtask.assignee && (
              <span className="text-gray-600">
                Assignee: {getAssigneeName()}
              </span>
            )}

            {subtask.reporter && (
              <span className="text-gray-600">
                Reporter: {getReporterName()}
              </span>
            )}

            {subtask.dueDate && (
              <span className="text-gray-600">
                Due: {formatDate(subtask.dueDate)}
              </span>
            )}

            {subtask.completedAt && (
              <span className="text-green-600">
                Completed: {formatDate(subtask.completedAt)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const SubtaskList = ({
  taskId,
  subtasks,
  members,
  onSubtasksChanged,
}) => {
  const [newSubtask, setNewSubtask] = useState({ title: "", status: "TO DO" });
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUser = authServices.getAuthUser();
  const [localSubtasks, setLocalSubtasks] = useState(subtasks);

  // Update local subtasks when props change
  useEffect(() => {
    setLocalSubtasks(subtasks);
  }, [subtasks]);

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtask.title.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/tasks/${taskId}/add-subtask`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...newSubtask,
            userId: currentUser._id,
            reporter: currentUser._id, // Add reporter field
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create subtask");
      }
      const createdSubtask = await response.json();
      const updatedSubtasks = [createdSubtask, ...localSubtasks];
      setLocalSubtasks(updatedSubtasks);
      onSubtasksChanged(updatedSubtasks);
      setNewSubtask({ title: "", status: "TO DO" });
      setIsAdding(false);
    } catch (error) {
      console.error("Error creating subtask:", error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // // Update the object comparison in the handleUpdateSubtask function
  const handleUpdateSubtask = async (subtaskId, updatedData) => {
    try {
      // Find the original subtask
      const originalSubtask = localSubtasks.find((st) => st._id === subtaskId);
      if (!originalSubtask) {
        throw new Error("Subtask not found");
      }

      // Create update object with only changed fields
      let changedFields = { userId: currentUser._id };

      // Handle status change
      if (updatedData.status) {
        handleStatusChange(originalSubtask, updatedData, changedFields);
      }

      // Handle changes to each field
      Object.keys(updatedData).forEach((key) => {
        if (shouldSkipField(key)) return;
        if (isAssigneeOrReporter(key)) {
          handleAssigneeOrReporterChange(
            originalSubtask,
            updatedData,
            key,
            changedFields
          );
        } else if (isDateField(key)) {
          handleDateFieldChange(
            originalSubtask,
            updatedData,
            key,
            changedFields
          );
        } else {
          handleRegularFieldChange(
            originalSubtask,
            updatedData,
            key,
            changedFields
          );
        }
      });

      // Optimistically update UI
      const optimisticSubtasks = localSubtasks.map((st) =>
        st._id === subtaskId ? { ...st, ...updatedData } : st
      );
      setLocalSubtasks(optimisticSubtasks);

      // Send API request only if changes exist (excluding userId)
      if (Object.keys(changedFields).length > 1) {
        await updateSubtaskOnServer(subtaskId, changedFields);
      } else {
        onSubtasksChanged(optimisticSubtasks);
      }
    } catch (error) {
      // Handle error and revert optimistic update
      setLocalSubtasks(subtasks);
      console.error("Error updating subtask:", error);
      alert(error.message);
      throw error;
    }
  };

  // Helper Functions

  // Skip certain fields from processing
  const shouldSkipField = (key) => key === "status" || key === "userId";

  // Handle status changes
  const handleStatusChange = (originalSubtask, updatedData, changedFields) => {
    if (updatedData.status !== originalSubtask.status) {
      changedFields.status = updatedData.status;
      if (updatedData.status === "DONE" && originalSubtask.status !== "DONE") {
        changedFields.completedAt = new Date().toISOString();
      } else if (
        updatedData.status !== "DONE" &&
        originalSubtask.status === "DONE"
      ) {
        changedFields.completedAt = null;
      }
    }
  };

  // Check if field is assignee or reporter
  const isAssigneeOrReporter = (key) =>
    key === "assignee" || key === "reporter";

  // Handle changes for assignee or reporter fields
  const handleAssigneeOrReporterChange = (
    originalSubtask,
    updatedData,
    key,
    changedFields
  ) => {
    const originalValue = originalSubtask[key];
    const newValue = updatedData[key];

    if (!originalValue && !newValue) return;

    if ((!newValue || newValue === "") && originalValue) {
      changedFields[key] = null;
      return;
    }

    const originalId = getIdFromValue(originalValue);
    const newId = getIdFromValue(newValue);

    if (originalId !== newId) {
      changedFields[key] = newId || newValue;
    }
  };

  // Get ID from value (whether it's an object or a primitive)
  const getIdFromValue = (value) => {
    if (!value) return null;
    return typeof value === "object" && value._id
      ? value._id.toString()
      : value.toString();
  };

  // Check if field is a date field
  const isDateField = (key) => key === "dueDate" || key === "completedAt";

  // Handle changes for date fields
  const handleDateFieldChange = (
    originalSubtask,
    updatedData,
    key,
    changedFields
  ) => {
    const originalDate = normalizeDate(originalSubtask[key]);
    const newDate = normalizeDate(updatedData[key]);

    if (originalDate !== newDate) {
      changedFields[key] = updatedData[key];
    }
  };

  // Normalize date for comparison
  const normalizeDate = (date) => {
    if (!date) return "";
    try {
      return new Date(date).toISOString().split("T")[0];
    } catch (e) {
      console.error("Error formatting date:", e);
      return "";
    }
  };

  // Handle changes for regular fields (strings, numbers, etc.)
  const handleRegularFieldChange = (
    originalSubtask,
    updatedData,
    key,
    changedFields
  ) => {
    if (originalSubtask[key] !== updatedData[key]) {
      changedFields[key] = updatedData[key];
    }
  };

  // Update subtask on the server
  const updateSubtaskOnServer = async (subtaskId, changedFields) => {
    const response = await fetch(
      `${process.env.REACT_APP_BASE_URL}/tasks/subtask/${subtaskId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changedFields),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update subtask");
    }

    const updatedSubtask = await response.json();
    const finalSubtasks = localSubtasks.map((st) =>
      st._id === subtaskId ? updatedSubtask : st
    );
    setLocalSubtasks(finalSubtasks);
    onSubtasksChanged(finalSubtasks);
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (!window.confirm("Are you sure you want to delete this subtask?")) {
      return;
    }

    try {
      // Optimistically update UI
      const updatedSubtasks = localSubtasks.filter(
        (st) => st._id !== subtaskId
      );
      setLocalSubtasks(updatedSubtasks);

      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/tasks/subtask/${subtaskId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentUser._id,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete subtask");
      }
      onSubtasksChanged(updatedSubtasks);
    } catch (error) {
      // Revert optimistic update on error
      setLocalSubtasks(subtasks);
      console.error("Error deleting subtask:", error);
      alert(error.message);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-medium mb-4 flex items-center">
        <svg
          className="h-5 w-5 mr-2"
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
        Subtasks
      </h3>

      {isAdding ? (
        <form
          onSubmit={handleAddSubtask}
          className="mb-4 p-3 border rounded-md"
        >
          <div className="mb-2">
            <input
              type="text"
              value={newSubtask.title}
              onChange={(e) =>
                setNewSubtask({ ...newSubtask, title: e.target.value })
              }
              placeholder="Subtask title"
              className="w-full p-2 border rounded"
              autoFocus
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
              disabled={isSubmitting || !newSubtask.title.trim()}
            >
              {isSubmitting ? "Adding..." : "Add Subtask"}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="mb-4 flex items-center text-sm text-blue-500 hover:text-blue-700"
        >
          <svg
            className="h-4 w-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Subtask
        </button>
      )}

      <div className="space-y-2 max-h-[700px] overflow-y-auto">
        {localSubtasks && localSubtasks.length > 0 ? (
          localSubtasks.map((subtask) => (
            <SubtaskItem
              key={subtask._id}
              subtask={subtask}
              members={members}
              onUpdate={handleUpdateSubtask}
              onDelete={handleDeleteSubtask}
            />
          ))
        ) : (
          <div className="text-gray-500 text-center p-4">No subtasks yet</div>
        )}
      </div>
    </div>
  );
};
SubtaskItem.propTypes = {
  subtask: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.oneOf([
      "BACKLOG",
      "TO DO",
      "IN PROGRESS",
      "REVIEW",
      "DONE",
    ]),
    priority: PropTypes.oneOf(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    assignee: PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string,
    }), // Assignee object with optional _id and name
    reporter: PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string,
    }), // Reporter object with optional _id and name
    dueDate: PropTypes.string,
    completedAt: PropTypes.string,
  }).isRequired,
  members: PropTypes.arrayOf(
    // members is an array of member objects
    PropTypes.shape({
      _id: PropTypes.string.isRequired, // Member ID is required
      name: PropTypes.string.isRequired, // Member name is required
    })
  ).isRequired, // Ensure members is an array of objects and required
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
SubtaskList.propTypes = {
  taskId: PropTypes.string.isRequired,
  subtasks: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      status: PropTypes.oneOf([
        "BACKLOG",
        "TO DO",
        "IN PROGRESS",
        "REVIEW",
        "DONE",
      ]),
      priority: PropTypes.oneOf(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
      assignee: PropTypes.shape({
        _id: PropTypes.string,
        name: PropTypes.string,
      }),
    })
  ).isRequired,
  members: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  onSubtasksChanged: PropTypes.func.isRequired,
};
