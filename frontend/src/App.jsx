import { AppRouter } from "./router";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MembersProvider } from "./context/MembersContext";
import "./App.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { NotificationProvider } from "./context/NotificationContext";
import { TaskProvider } from "./context/TaskContext";
function App() {
  return (
    // <BrowserRouter>
    <MembersProvider>
      {/* <TaskProvider> */}
      <NotificationProvider>
        <AppRouter />
      </NotificationProvider>
      {/* </TaskProvider> */}
    </MembersProvider>

    // </BrowserRouter>
  );
}

export default App;
