import { AppRouter } from "./router";
import { MembersProvider } from "./context/MembersContext";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { NotificationProvider } from "./context/NotificationContext";
function App() {
  return (
    <MembersProvider>
      <NotificationProvider>
        <AppRouter />
      </NotificationProvider>
    </MembersProvider>
  );
}

export default App;
