import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { LoginForm, SignupForm, KanbanBoard } from "../components/auth";
import AppBar from "../components/appbar/AppBar";
import Sidebar from "../components/Board/sidebar/sidebar";
import TopNavbar from "../components/Board/navbar/navbar";
import { TaskColoumn } from "../components/kanbanboard/task";
export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppBar />,
    children: [
      //   {
      //     index: true,
      //     element: <ProductsPage />,
      //   },
      //   {
      //     path: "signup",
      //     element: <SignupForm />,
      //   },
      //   {
      //     path: "admin",
      //     element: (
      //       <SecureRoute>
      //         <AdminLayout />
      //       </SecureRoute>
      //     ),
      //     children: [
      //       {
      //         index: true,
      //         element: <div>Admin Dashboard</div>,
      //       },
      //       {
      //         path: "inventory",
      //         element: <InventoryPage />,
      //       },
      //       {
      //         path: "profile",
      //         element: <div>Admin Profile</div>,
      //       },
      //     ],
      //   },
    ],
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
    element: <KanbanBoard />,
    children: [
      {
        index: true,
        element: <Sidebar />,
      },
      {
        index: true,
        element: <TopNavbar />,
      },
      {
        index: true,
        element: <TaskColoumn />,
      },
    ],
  },
]);
export const AppRouter = ({ children }) => {
  return <RouterProvider router={router}>{children}</RouterProvider>;
};
