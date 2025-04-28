import React from "react";

export const EventCard = ({
  event,
  title,
  handleEventMouseEnter,
  handleEventMouseLeave,
}) => {
  console.log("EventCard", event);
  return (
    <div
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
    </div>
  );
};
