import { AppRouter } from "./router";
import { MembersProvider } from "./context/MembersContext";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { NotificationProvider } from "./context/NotificationContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
function App() {
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <MembersProvider>
        <NotificationProvider>
          <AppRouter />
        </NotificationProvider>
      </MembersProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
