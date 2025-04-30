import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { authServices } from "../auth";
import propTypes from "prop-types";
// Create context
const MembersContext = createContext();

// Custom hook to use the members context
export const useMembers = () => useContext(MembersContext);
const defaultStats = {
  total: 0,
  byStatus: {
    BACKLOG: [],
    "TO DO": [],
    "IN PROGRESS": [],
    REVIEW: [],
    DONE: [],
  },
  byPriority: {
    LOW: [],
    MEDIUM: [],
    HIGH: [],
    CRITICAL: [],
  },
  upcomingDeadlines: [],
  overdueTasks: [],
  byProject: {},
};
// Provider component
export const MembersProvider = ({ children }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]); // State for teams

  // for tasks
  const [allTasks, setAllTasks] = useState([]);

  const currentUser = authServices.getAuthUser();
  const userId = currentUser ? currentUser._id : null;

  // Create a fetchData function that can be reused
  const fetchProjectsAndMembers = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/projects/user/${userId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();
      setProjects(data);
      // Extract unique members from all projects
      const uniqueMembers = new Set();
      data.forEach((project) => {
        if (project.members && Array.isArray(project.members)) {
          project.members.forEach((member) => {
            const memberId = typeof member === "object" ? member._id : member;
            uniqueMembers.add(memberId);
          });
        }
      });

      // Add current user if not included
      if (userId) uniqueMembers.add(userId);

      // Skip if no members found
      if (uniqueMembers.size === 0) {
        setMembers([]);
        setLoading(false);
        return;
      }

      // Fetch details for unique members
      const membersData = await Promise.all(
        [...uniqueMembers].map((memberId) =>
          fetch(`${process.env.REACT_APP_BASE_URL}/api/user/${memberId}`)
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null)
        )
      );

      // Filter out null results
      const validMembers = membersData.filter((m) => m !== null);
      setMembers(validMembers);

      // Fetch tasks for all projects
      let allProjectTasks = [];
      for (const project of data) {
        const tasksResponse = await fetch(
          `${process.env.REACT_APP_BASE_URL}/projects/${project._id}/tasks`
        );
        if (tasksResponse.ok) {
          const projectTasks = await tasksResponse.json();
          allProjectTasks = allProjectTasks.concat(projectTasks);
        }
      }
      setAllTasks(allProjectTasks);

      const teamresponse = await fetch(
        `${process.env.REACT_APP_BASE_URL}/teams/my-teams/${userId}`
      );
      if (!teamresponse.ok) throw new Error("Failed to fetch teams");
      const teamdata = await teamresponse.json();
      setTeams(teamdata);

      return true; // Indicate successful refresh
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
      return false; // Indicate failed refresh
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Expose the refreshData function to consumers
  const refreshData = useCallback(async () => {
    return await fetchProjectsAndMembers();
  }, [fetchProjectsAndMembers]);

  // Fetch members once when provider mounts
  useEffect(() => {
    fetchProjectsAndMembers();
  }, [fetchProjectsAndMembers]);

  // Expose the value
  return (
    <MembersContext.Provider
      value={useMemo(
        () => ({
          members,
          loading,
          error,
          setMembers,
          projects,
          setProjects,
          allTasks,
          teams,
          refreshData, // Add the refresh function to the context
        }),
        [
          members,
          loading,
          error,
          setMembers,
          projects,
          setProjects,
          allTasks,
          teams,
          refreshData, // Recreate the memoized value only when any of these dependencies change
        ]
      )}
    >
      {children}
    </MembersContext.Provider>
  );
};
MembersProvider.propTypes = {
  children: propTypes.node.isRequired,
};
