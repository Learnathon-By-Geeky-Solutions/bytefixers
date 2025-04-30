import propTypes from "prop-types";
import React from "react";

export const EventCard = ({
  event,
  title,
  handleEventMouseEnter,
  handleEventMouseLeave,
}) => {
  console.log("EventCard", event);
  return (
    <button
      onMouseEnter={(e) => {
        e.stopPropagation(); // Prevent event bubbling
        handleEventMouseEnter(event, e);
      }}
      onMouseLeave={(e) => {
        e.stopPropagation(); // Prevent event bubbling
        handleEventMouseLeave();
      }}
      className="h-full w-full truncate"
      style={{
        overflow: "hidden",
        cursor: "pointer",
        position: "relative", // Ensure position context for mouse events
      }}
    >
      <span>{title}</span>
    </button>
  );
};

EventCard.propTypes = {
  event: propTypes.object.isRequired,
  title: propTypes.string.isRequired,
  handleEventMouseEnter: propTypes.func.isRequired,
  handleEventMouseLeave: propTypes.func.isRequired,
};
