import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { LoginForm, SignupForm } from "../components/auth";
import AppBar from "../components/appbar/AppBar";
import Sidebar from "../components/Board/sidebar/sidebar";
import TopNavbar from "../components/Board/navbar/navbar";
import { TaskColoumn } from "../components/kanbanboard/task";
import { ProjectCreate } from "../components/project/recentProjects";
import { Dashboard } from "../components/project";
import { ProjectTable } from "../components/project/projectTable";
import { TaskForm } from "../components/kanbanboard/task/TaskForm";
import { TaskLists } from "../components/kanbanboard/taskLists/TaskLists";
import { TeamCreate } from "../components/team";
import { TaskDetails } from "../components/kanbanboard/task/TaskDetails";
import { FilesPage } from "../components/file/FilesPage";
import { NotificationBell } from "../components/notification/NotificationBell";
import { ProjectCalendar } from "../components/calendar/ProjectCalendar";
import { PersonalTaskStats } from "../components/project/PersonalTaskStats";
import { UserProfile } from "../components/auth/UserProfile";
const KanbanLayout = () => {
  return (
    <div className="kanban-layout flex">
      <Sidebar />
      <Outlet />
      {/* This is where the nested route (ProjectCreate) will render */}
    </div>
  );
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppBar />,
    children: [],
  },
  {
    path: "/signup",
    element: <SignupForm />,
  },
  {
    path: "/login",
    element: <LoginForm />,
  },
  {
    path: "/kanbanBoard",
    element: <KanbanLayout />,
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "profile",
        element: <UserProfile />,
      },
      {
        path: "projects",
        element: <ProjectTable />,
      },
      {
        path: "projects/:projectid", // Dynamic route for project details
        element: <TopNavbar />, // Create this component
      },
      {
        path: "list/projects/:projectid",
        element: <TaskLists />,
      },
      {
        path: "team-members",
        element: <TeamCreate />,
      },
      {
        path: "files",
        element: <FilesPage />,
      },
      {
        path: "project/:projectId/calendar",
        element: <ProjectCalendar />,
      },
    ],
  },
  {
    path: "/project/:projectId/task/:taskId",
    element: <TaskDetails />,
  },
]);
export const AppRouter = ({ children }) => {
  return <RouterProvider router={router}>{children}</RouterProvider>;
};
