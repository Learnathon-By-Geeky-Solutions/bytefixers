import React, { useState, useRef } from "react";
import { EventCard } from "./EventCard";
import { EventTooltip } from "./EventTooltip"; // Assuming you have an EventTooltip component
import propTypes from "prop-types";
export const EventComponent = ({
  event,
  title,
  handleEventMouseEnter,
  handleEventMouseLeave,
  tooltipPosition,
}) => {
  const [tooltipEvent, setTooltipEvent] = useState(null);
  const tooltipRef = useRef(null);
  const tooltipTimeoutRef = useRef(null);

  return (
    <>
      <EventCard
        event={event}
        title={title}
        handleEventMouseEnter={handleEventMouseEnter}
        handleEventMouseLeave={handleEventMouseLeave}
      />
      {tooltipEvent && (
        <div
          ref={tooltipRef}
          className="absolute z-50 bg-gray-800 text-white text-xs px-3 py-2 rounded"
          style={{
            left: `${tooltipPosition.left}px`,
            top: `${tooltipPosition.top}px`,
            pointerEvents: "auto", // Ensure the tooltip can receive mouse events
            transition: "all 0.2s ease-in-out", // Add a smooth transition for tooltip appearance
            opacity: tooltipEvent ? 1 : 0, // Make sure the tooltip is visible
          }}
          onMouseEnter={() => {
            // Clear the timeout when mouse enters the tooltip
            if (tooltipTimeoutRef.current) {
              clearTimeout(tooltipTimeoutRef.current);
            }
          }}
          onMouseLeave={() => {
            // Hide tooltip immediately when mouse leaves the tooltip
            setTooltipEvent(null);
          }}
        >
          {/* You can render additional tooltip content here */}
          <EventTooltip event={tooltipEvent} />{" "}
          {/* Render event details inside the tooltip */}
        </div>
      )}
    </>
  );
};

EventComponent.propTypes = {
  event: propTypes.object.isRequired,
  title: propTypes.string.isRequired,
  handleEventMouseEnter: propTypes.func.isRequired,
  handleEventMouseLeave: propTypes.func.isRequired,
  tooltipPosition: propTypes.shape({
    left: propTypes.number.isRequired,
    top: propTypes.number.isRequired,
  }).isRequired,
};
