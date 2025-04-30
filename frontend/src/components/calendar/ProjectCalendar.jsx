import React, { useState, useEffect, useRef } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useParams } from "react-router-dom";
import { authServices } from "../../auth";
import { EventModal } from "./EventModal";
import { EventTooltip } from "./EventTooltip";
import { EventComponent } from "./EventComponent";
const locales = {
  "en-US": require("date-fns/locale/en-US"),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});
const EventComponentWithHandlers = (
  handleEventMouseEnter,
  handleEventMouseLeave,
  tooltipPosition
) => {
  // This returns a function that React-Big-Calendar will call with event props
  return (props) => (
    <EventComponent
      {...props}
      handleEventMouseEnter={handleEventMouseEnter}
      handleEventMouseLeave={handleEventMouseLeave}
      tooltipPosition={tooltipPosition}
    />
  );
};
export const ProjectCalendar = () => {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("month");
  const { projectId } = useParams();
  const currentUser = authServices.getAuthUser();
  const [tooltipEvent, setTooltipEvent] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);
  const tooltipTimeoutRef = useRef(null);
  useEffect(() => {
    fetchEvents();
  }, [projectId]);

  // Add tooltip handling functions
  const handleEventMouseEnter = React.useCallback((event, e) => {
    console.log("Event mouse enter:", event);
    console.log("Event mouse enter:", e);
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current); // Clear any previous timeouts
    }

    const rect = e.currentTarget.getBoundingClientRect(); // Get the element's position

    // Position the tooltip slightly below and to the right of the cursor
    const position = {
      left: rect.left + window.scrollX,
      top: rect.bottom + window.scrollY,
    };

    // Adjust position to ensure the tooltip stays within the viewport
    if (tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      // Prevent tooltip from going off the right edge of the screen
      if (position.left + tooltipRect.width > viewportWidth) {
        position.left = Math.max(10, viewportWidth - tooltipRect.width - 10);
      }
    }

    setTooltipPosition(position); // Set tooltip position
    setTooltipEvent(event); // Set the current event
  }, []);

  // Handle mouse leave
  const handleEventMouseLeave = React.useCallback(() => {
    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltipEvent(null); // Hide tooltip after timeout
    }, 100); // Delay hiding by 100ms
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/calendar/project/${projectId}`
      );
      if (!response.ok) throw new Error("Failed to fetch events");

      const data = await response.json();
      // Format calendar events
      const calendarEvents = data
        .filter((event) => event.startDate || event.dueDate)
        .map((event) => ({
          id: event._id,
          title: event.title,
          start: new Date(event.startDate || event.dueDate),
          end: new Date(event.endDate || event.dueDate),
          resourceId: event.task?._id,
          eventType:
            event.eventType || (event.dueDate ? "TASK_DUE" : "MEETING"),
          priority: event.priority || "MEDIUM",
          status: event.status,
          description: event.description || "",
          participants: event.participants || [],
          createdBy: event.createdBy || currentUser._id,
          allDay: event.eventType === "MILESTONE" || !event.endDate,
        }));

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };
  const customEventComponent = React.useMemo(() => {
    return EventComponentWithHandlers(
      handleEventMouseEnter,
      handleEventMouseLeave,
      tooltipPosition
    );
  }, [handleEventMouseEnter, handleEventMouseLeave, tooltipPosition]);

  const eventStyleGetter = (event) => {
    let backgroundColor; // default blue

    // Color by event type
    switch (event.eventType) {
      case "TASK_DUE":
        backgroundColor = "#e53e3e"; // red for due dates
        break;
      case "MILESTONE":
        backgroundColor = "#805ad5"; // purple for milestones
        break;
      case "MEETING":
        backgroundColor = "#3182ce"; // blue for meetings
        break;
      case "REMINDER":
        backgroundColor = "#ed8936"; // orange for reminders
        break;
      default:
        backgroundColor = "#3182cf";
    }

    // Override with priority if it's high or critical
    if (event.priority === "HIGH") {
      backgroundColor = "#e53e3e"; // red
    } else if (event.priority === "CRITICAL") {
      backgroundColor = "#822727"; // dark red
    }

    // Add strikethrough for completed events
    const textDecoration =
      event.status === "COMPLETED" ? "line-through" : "none";

    return {
      style: {
        backgroundColor,
        borderRadius: "5px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
        textDecoration,
      },
    };
  };

  const handleSelectSlot = ({ start, end }) => {
    setSelectedEvent({ start, end });
    setIsModalOpen(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleSaveEvent = (eventData) => {
    fetchEvents(); // Reload all events
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  return (
    <div className="h-screen p-4 ml-24 width-auto">
      <div className="bg-white rounded-lg shadow p-6 h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Project Calendar</h2>
          <button
            onClick={() => {
              setSelectedEvent({
                start: new Date(),
                end: new Date(new Date().setHours(new Date().getHours() + 1)),
              });
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            + Create Event
          </button>
        </div>

        <div className="flex items-center mb-4">
          <div className="flex space-x-2 text-sm">
            <div className="flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full inline-block mr-1"></span>
              <span>Meeting</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-red-500 rounded-full inline-block mr-1"></span>
              <span>Task Due</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-purple-500 rounded-full inline-block mr-1"></span>
              <span>Milestone</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-orange-500 rounded-full inline-block mr-1"></span>
              <span>Reminder</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "calc(100vh - 200px)" }}
            eventPropGetter={eventStyleGetter}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            onView={handleViewChange}
            view={view}
            selectable
            popup
            views={["month", "week", "day", "agenda"]}
            step={15}
            timeslots={4}
            showMultiDayTimes
            components={{
              event: customEventComponent,
            }}
          />
        )}
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
        onSave={handleSaveEvent}
        event={selectedEvent}
        projectId={projectId}
      />
      {tooltipEvent && (
        <button
          ref={tooltipRef}
          className="fixed z-50 animate-fade-in animate-duration-150"
          style={{
            left: `${tooltipPosition.left}px`,
            top: `${tooltipPosition.top}px`,
            pointerEvents: "auto", // Ensure tooltip can receive mouse events
          }}
          onMouseEnter={() => {
            // Clear the timeout when mouse enters the tooltip
            if (tooltipTimeoutRef.current) {
              clearTimeout(tooltipTimeoutRef.current);
            }
          }}
          onMouseLeave={() => {
            // Hide tooltip immediately when mouse leaves the tooltip itself
            setTooltipEvent(null);
          }}
        >
          <EventTooltip event={tooltipEvent} />
        </button>
      )}
    </div>
  );
};
