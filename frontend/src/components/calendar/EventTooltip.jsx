import React from "react";
import { format } from "date-fns";
import PropTypes from "prop-types";
export const EventTooltip = ({ event }) => {
  if (!event) return null;

  // Format dates
  const startDate = format(new Date(event.start), "MMM d, yyyy h:mm a");
  const endDate = format(new Date(event.end), "MMM d, yyyy h:mm a");
  const isSameDay =
    format(new Date(event.start), "yyyy-MM-dd") ===
    format(new Date(event.end), "yyyy-MM-dd");

  // Set icon based on event type
  let icon; // default
  switch (event.eventType) {
    case "TASK_DUE":
      icon = "📋";
      break;
    case "MILESTONE":
      icon = "🏁";
      break;
    case "MEETING":
      icon = "👥";
      break;
    case "REMINDER":
      icon = "🔔";
      break;
    default:
      icon = "📅";
      break;
  }

  // Set priority badge color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "LOW":
        return "bg-green-100 text-green-800";
      case "MEDIUM":
        return "bg-blue-100 text-blue-800";
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "CRITICAL":
        return "bg-red-200 text-red-900";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Set status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-start mb-3">
        <span className="text-2xl mr-3">{icon}</span>
        <div>
          <h3 className="font-bold text-gray-800 text-lg">{event.title}</h3>
          <p className="text-sm text-gray-600">
            {isSameDay ? (
              <>
                {format(new Date(event.start), "MMM d, yyyy")}
                <br />
                {format(new Date(event.start), "h:mm a")} -{" "}
                {format(new Date(event.end), "h:mm a")}
              </>
            ) : (
              <>
                {startDate} - <br />
                {endDate}
              </>
            )}
          </p>
        </div>
      </div>

      {event.description && (
        <div className="mb-3 border-t border-b border-gray-100 py-2">
          <p className="text-gray-700 text-sm">{event.description}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-2">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
            event.priority
          )}`}
        >
          {event.priority}
        </span>

        {event.status && (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              event.status
            )}`}
          >
            {event.status}
          </span>
        )}

        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {event.eventType || "EVENT"}
        </span>
      </div>
      {event.task && (
        <div className="flex items-center mb-2">
          <svg
            className="w-4 h-4 mr-1 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span className="text-xs text-gray-600">Related to task</span>
        </div>
      )}

      {event.participants && event.participants.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-medium text-gray-500 mb-1">
            PARTICIPANTS
          </h4>
          <div className="flex -space-x-2 overflow-hidden">
            {event.participants.slice(0, 5).map((participant) => {
              // Fallback to 'U' if participant.name is missing or invalid
              const initial = participant.name
                ? participant.name.charAt(0).toUpperCase()
                : "U";

              return (
                <div
                  key={participant.name}
                  className="inline-block h-6 w-6 rounded-full bg-gray-200 border border-white flex items-center justify-center text-xs text-gray-600"
                >
                  {initial}
                </div>
              );
            })}
            {event.participants.length > 5 && (
              <div className="inline-block h-6 w-6 rounded-full bg-gray-300 border border-white flex items-center justify-center text-xs">
                +{event.participants.length - 5}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="text-right mt-2">
        <span className="text-xs text-gray-500">Click to view details</span>
      </div>
    </div>
  );
};

EventTooltip.propTypes = {
  event: PropTypes.shape({
    start: PropTypes.string.isRequired, // Start date (ISO string)
    end: PropTypes.string.isRequired, // End date (ISO string)
    description: PropTypes.string, // Event description
    priority: PropTypes.oneOf(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    status: PropTypes.oneOf([
      "SCHEDULED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
    ]), // Event status (e.g., 'active', 'completed')
    eventType: PropTypes.string, // Type of event (e.g., 'meeting', 'workshop')
    task: PropTypes.string, // Optional task for the event
    participants: PropTypes.arrayOf(
      // Array of participants
      PropTypes.shape({
        name: PropTypes.string, // Each participant must have a name
        email: PropTypes.string, // Optional email for each participant
      })
    ).isRequired, // Participants must be an array of objects
    title: PropTypes.string.isRequired, // Event title
  }), // The event object is required
};
