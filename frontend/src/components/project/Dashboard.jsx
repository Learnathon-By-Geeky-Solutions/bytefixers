import React, { useState, useEffect } from "react";
import { Typography, IconButton } from "../../common/icons";
import { ProjectCreate } from "./recentProjects";
import { PersonalTaskStats } from "./PersonalTaskStats";
import { TeamWorkload } from "./TeamWorkload";
import { useMembers } from "../../context/MembersContext";

export const Dashboard = () => {
  // Access the refresh function from context
  const { refreshData, loading } = useMembers();

  // State to track when last refresh occurred
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // State to show refresh animation
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshData().then(() => {
      setLastRefreshed(new Date());
      setTimeout(() => setIsRefreshing(false), 500); // Add slight delay for animation
    });
  };

  // Auto-refresh on component mount and when dependencies change
  useEffect(() => {
    // Initial refresh
    refreshData();
    setLastRefreshed(new Date());

    // Set up auto-refresh interval (every 30 seconds)
    const refreshInterval = setInterval(() => {
      refreshData();
      setLastRefreshed(new Date());
    }, 30000);

    // Clean up on component unmount
    return () => clearInterval(refreshInterval);
  }, [refreshData]);

  // Listen for route changes to trigger refresh
  useEffect(() => {
    const handleRouteChange = () => {
      refreshData();
      setLastRefreshed(new Date());
    };

    // Add event listener for navigation events
    window.addEventListener("popstate", handleRouteChange);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, [refreshData]);

  return (
    <div className="pl-20">
      <div className="flex justify-between items-center mx-10 mt-20 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Typography variant="body2" color="textSecondary">
            An overview of what's happening around
          </Typography>
        </div>

        {/* Refresh button with animation */}
        <div className="flex items-center">
          <span className="text-xs text-gray-500 mr-2">
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </span>
          <IconButton
            onClick={handleRefresh}
            className={`text-blue-500 p-1 rounded-full hover:bg-blue-50 ${
              isRefreshing ? "animate-spin" : ""
            }`}
            disabled={loading || isRefreshing}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
          </IconButton>
        </div>
      </div>

      {/* Key dashboard components with keys to force re-render */}
      <div
        key={`personal-stats-${lastRefreshed.getTime()}`}
        className="mb-8 mx-10"
      >
        <PersonalTaskStats />
      </div>

      <div
        key={`team-workload-${lastRefreshed.getTime()}`}
        className="mb-8 mx-10"
      >
        <TeamWorkload />
      </div>

      <div
        key={`project-create-${lastRefreshed.getTime()}`}
        className="mb-8 mx-10"
      >
        <ProjectCreate />
      </div>
    </div>
  );
};
