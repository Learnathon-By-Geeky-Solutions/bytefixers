import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { LoginForm, SignupForm } from "../components/auth";
import AppBar from "../components/appbar/AppBar";
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
]);
export const AppRouter = ({ children }) => {
  return <RouterProvider router={router}>{children}</RouterProvider>;
};
