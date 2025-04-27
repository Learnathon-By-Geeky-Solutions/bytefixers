import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { authServices } from "../../auth";
import { useMembers } from "../../context/MembersContext";
import PropTypes from "prop-types";
export const EventModal = ({
  isOpen,
  onClose,
  onSave,
  event = null,
  projectId,
}) => {
  const { members } = useMembers();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: new Date(),
    endDate: new Date(new Date().setHours(new Date().getHours() + 1)),
    eventType: "MEETING",
    participants: [],
    task: null,
    priority: "MEDIUM",
  });
  const [tasks, setTasks] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  //   const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchTasks();
      //   fetchMembers();

      if (event?.id) {
        // Edit existing event
        setFormData({
          title: event.title || "",
          description: event.description || "",
          startDate: event.start || new Date(),
          endDate:
            event.end ||
            new Date(new Date().setHours(new Date().getHours() + 1)),
          eventType: event.eventType || "MEETING",
          participants: event.participants || [],
          task: event.resourceId || null,
          priority: event.priority || "MEDIUM",
        });
      } else if (event?.start) {
        // New event with selected time slot
        setFormData((prev) => ({
          ...prev,
          startDate: event.start,
          endDate:
            event.end ||
            new Date(
              new Date(event.start).setHours(
                new Date(event.start).getHours() + 1
              )
            ),
        }));
      }
    }
  }, [isOpen, event, projectId]);

  const fetchTasks = async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/projects/${projectId}/tasks`
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date, field) => {
    setFormData((prev) => ({ ...prev, [field]: date }));
  };

  const handleParticipantsChange = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setFormData((prev) => ({ ...prev, participants: selectedOptions }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";

    if (formData.startDate >= formData.endDate) {
      newErrors.endDate = "End date must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    const eventData = {
      title: formData.title,
      description: formData.description,
      startDate: formData.startDate,
      endDate: formData.endDate,
      eventType: formData.eventType,
      project: projectId,
      participants: formData.participants,
      task: formData.task,
      priority: formData.priority,
      createdBy: authServices.getAuthUser()._id,
    };

    try {
      const response = await fetch(
        `http://localhost:4000/api/calendar${event?.id ? `/${event.id}` : ""}`,
        {
          method: event?.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventData),
        }
      );

      if (!response.ok) throw new Error("Failed to save event");

      const savedEvent = await response.json();
      onSave(savedEvent);
      onClose();
    } catch (error) {
      console.error("Error saving event:", error);
      setErrors((prev) => ({ ...prev, submit: error.message }));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {event?.id ? "Edit Event" : "Create New Event"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="mb-4">
            <div className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </div>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full border ${
                errors.title ? "border-red-500" : "border-gray-300"
              } rounded-md p-2`}
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title}</p>
            )}
          </div>

          {/* Event Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Type
            </label>
            <select
              name="eventType"
              value={formData.eventType}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value="MEETING">Meeting</option>
              <option value="TASK_DUE">Task Due Date</option>
              <option value="MILESTONE">Milestone</option>
              <option value="REMINDER">Reminder</option>
            </select>
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <DatePicker
                selected={formData.startDate}
                onChange={(date) => handleDateChange(date, "startDate")}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                className={`w-full border ${
                  errors.startDate ? "border-red-500" : "border-gray-300"
                } rounded-md p-2`}
              />
              {errors.startDate && (
                <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <DatePicker
                selected={formData.endDate}
                onChange={(date) => handleDateChange(date, "endDate")}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                className={`w-full border ${
                  errors.endDate ? "border-red-500" : "border-gray-300"
                } rounded-md p-2`}
                minDate={formData.startDate}
              />
              {errors.endDate && (
                <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full border border-gray-300 rounded-md p-2"
            ></textarea>
          </div>

          {/* Task Relation */}
          <div className="mb-4">
            <div className="block text-sm font-medium text-gray-700 mb-1">
              Related Task
            </div>
            <select
              name="task"
              value={formData.task || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value="">None</option>
              {tasks.map((task) => (
                <option key={task._id} value={task._id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="mb-4">
            <div className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </div>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          {/* Participants */}
          <div className="mb-4">
            <div className="block text-sm font-medium text-gray-700 mb-1">
              Participants
            </div>
            <select
              name="participants"
              multiple
              value={formData.participants}
              onChange={handleParticipantsChange}
              className="w-full border border-gray-300 rounded-md p-2 h-24"
            >
              {members.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Hold Ctrl/Cmd to select multiple members
            </p>
          </div>

          {errors.submit && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
              {errors.submit}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
EventModal.propTypes = {
  isOpen: PropTypes.bool.isRequired, // Ensuring isOpen is a boolean and required
  onClose: PropTypes.func.isRequired, // Ensuring onClose is a function and required
  onSave: PropTypes.func.isRequired, // Ensuring onSave is a function and required
  event: PropTypes.object, // event can be an object or null (since you default it to null)
  projectId: PropTypes.string.isRequired, // Ensuring projectId is a string and required
};
