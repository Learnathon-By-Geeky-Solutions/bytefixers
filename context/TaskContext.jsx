// import React, { createContext, useContext, useState, useEffect } from "react";
// import { authServices } from "../auth";
// import { useMembers } from "./MembersContext";

// // Create context
// const TaskContext = createContext();

// // Custom hook
// export const useTaskContext = () => useContext(TaskContext);

// // Default task stats to prevent null errors
// const defaultStats = {
//   total: 0,
//   byStatus: {
//     BACKLOG: [],
//     "TO DO": [],
//     "IN PROGRESS": [],
//     REVIEW: [],
//     DONE: [],
//   },
//   byPriority: {
//     LOW: [],
//     MEDIUM: [],
//     HIGH: [],
//     CRITICAL: [],
//   },
//   upcomingDeadlines: [],
//   overdueTasks: [],
//   byProject: {},
// };

// export const TaskProvider = ({ children }) => {
//   const [allTasks, setAllTasks] = useState([]);
//   const [userTasks, setUserTasks] = useState([]);
//   const [taskStats, setTaskStats] = useState(defaultStats); // Initialize with default
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [reloadFlag, setReloadFlag] = useState(0); // triggers re-fetch

//   const { projects, loading: projectsLoading } = useMembers();
//   const currentUser = authServices.getAuthUser();

//   useEffect(() => {
//     // Add a timeout protection
//     const timeoutId = setTimeout(() => {
//       if (loading) {
//         console.log("Task loading timed out after 15 seconds");
//         setLoading(false);
//         setError("Loading timed out. Please try again.");
//       }
//     }, 15000); // 15 second timeout

//     const fetchAllTasks = async () => {
//       if (projectsLoading || !projects || !currentUser) {
//         setLoading(false);
//         return;
//       }

//       try {
//         setLoading(true);
//         console.log("Fetching tasks for all projects");

//         let allProjectTasks = [];

//         // Create an AbortController to timeout long-running requests
//         const controller = new AbortController();
//         const timeoutId = setTimeout(() => controller.abort(), 10000);

//         for (const project of projects) {
//           try {
//             // Try multiple API endpoints - this helps with backend API path inconsistencies
//             const endpoints = [
//               `http://localhost:4000/projects/${project._id}/tasks`,
//               `http://localhost:4000/tasks/${project._id}`,
//             ];

//             let succeeded = false;

//             for (const endpoint of endpoints) {
//               if (succeeded) break;

//               try {
//                 console.log(`Trying endpoint: ${endpoint}`);
//                 const response = await fetch(endpoint, {
//                   signal: controller.signal,
//                 });

//                 if (response.ok) {
//                   const projectTasks = await response.json();
//                   console.log(
//                     `Loaded ${projectTasks.length} tasks for project ${project._id}`
//                   );

//                   const tasksWithProject = projectTasks.map((task) => ({
//                     ...task,
//                     projectInfo: {
//                       _id: project._id,
//                       title: project.title || project.name,
//                     },
//                   }));

//                   allProjectTasks = [...allProjectTasks, ...tasksWithProject];
//                   succeeded = true;
//                   break;
//                 } else {
//                   console.warn(
//                     `Endpoint ${endpoint} returned ${response.status}`
//                   );
//                 }
//               } catch (err) {
//                 if (err.name === "AbortError") {
//                   console.warn(`Request to ${endpoint} timed out`);
//                 } else {
//                   console.error(`Error with ${endpoint}:`, err);
//                 }
//               }
//             }

//             if (!succeeded) {
//               console.warn(
//                 `Failed to load tasks for project ${project._id} from any endpoint`
//               );
//             }
//           } catch (err) {
//             console.error(`Error processing project ${project._id}:`, err);
//           }
//         }

//         clearTimeout(timeoutId);

//         console.log(`Loaded ${allProjectTasks.length} tasks total`);
//         setAllTasks(allProjectTasks);

//         const currentUserTasks = allProjectTasks.filter(
//           (task) =>
//             task.assignee &&
//             (typeof task.assignee === "object"
//               ? task.assignee._id === currentUser._id
//               : task.assignee === currentUser._id)
//         );

//         console.log(`Found ${currentUserTasks.length} tasks for current user`);
//         setUserTasks(currentUserTasks);
//         calculateTaskStats(currentUserTasks);
//       } catch (error) {
//         console.error("Error fetching tasks:", error);
//         setError(error.message || "Failed to load tasks");

//         // Always set some data to avoid UI errors
//         if (!taskStats || taskStats === defaultStats) {
//           setTaskStats(defaultStats);
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     const calculateTaskStats = (tasks) => {
//       if (!tasks || tasks.length === 0) {
//         setTaskStats(defaultStats);
//         return;
//       }

//       try {
//         const byStatus = {
//           BACKLOG: tasks.filter((task) => task.status === "BACKLOG"),
//           "TO DO": tasks.filter((task) => task.status === "TO DO"),
//           "IN PROGRESS": tasks.filter((task) => task.status === "IN PROGRESS"),
//           REVIEW: tasks.filter((task) => task.status === "REVIEW"),
//           DONE: tasks.filter((task) => task.status === "DONE"),
//         };

//         const byPriority = {
//           LOW: tasks.filter((task) => task.priority === "LOW"),
//           MEDIUM: tasks.filter((task) => task.priority === "MEDIUM"),
//           HIGH: tasks.filter((task) => task.priority === "HIGH"),
//           CRITICAL: tasks.filter((task) => task.priority === "CRITICAL"),
//         };

//         const today = new Date();

//         const upcomingDeadlines = tasks
//           .filter((task) => task.status !== "DONE" && task.dueDate)
//           .filter((task) => {
//             try {
//               const dueDate = new Date(task.dueDate);
//               const diffTime = dueDate - today;
//               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//               return diffDays >= 0 && diffDays <= 7;
//             } catch (err) {
//               console.warn("Error processing due date:", err);
//               return false;
//             }
//           })
//           .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

//         const overdueTasks = tasks
//           .filter((task) => task.status !== "DONE" && task.dueDate)
//           .filter((task) => {
//             try {
//               return new Date(task.dueDate) < today;
//             } catch (err) {
//               console.warn("Error processing overdue date:", err);
//               return false;
//             }
//           })
//           .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

//         const byProject = {};
//         tasks.forEach((task) => {
//           if (task.projectInfo) {
//             const projectId = task.projectInfo._id;
//             if (!byProject[projectId]) {
//               byProject[projectId] = {
//                 project: task.projectInfo,
//                 tasks: [],
//               };
//             }
//             byProject[projectId].tasks.push(task);
//           }
//         });

//         setTaskStats({
//           total: tasks.length,
//           byStatus,
//           byPriority,
//           byProject,
//           upcomingDeadlines,
//           overdueTasks,
//         });
//       } catch (err) {
//         console.error("Error calculating task stats:", err);
//         setTaskStats(defaultStats);
//       }
//     };

//     fetchAllTasks();

//     // Clean up the timeout
//     return () => clearTimeout(timeoutId);
//   }, [projects, currentUser, projectsLoading, reloadFlag]);

//   return (
//     <TaskContext.Provider
//       value={{
//         allTasks,
//         userTasks,
//         taskStats,
//         loading,
//         error,
//         refreshTasks: () => setReloadFlag((prev) => prev + 1),
//       }}
//     >
//       {children}
//     </TaskContext.Provider>
//   );
// };
