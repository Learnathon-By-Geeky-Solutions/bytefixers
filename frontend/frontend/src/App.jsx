import { AppRouter } from "./router";
import { MembersProvider } from "./context/MembersContext";
import "./App.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { NotificationProvider } from "./context/NotificationContext";
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
