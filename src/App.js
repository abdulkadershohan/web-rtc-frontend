import { AppBar, Typography } from "@mui/material";
import "./App.css";
import Notifications from "./components/Notifications";
import Sidebar from "./components/Sidebar";
import VideoPlayer from "./components/VideoPlayer";

const App = () => {
  return (
    <div className="app-root">
      <AppBar position="static" color="inherit" className="app-bar">
        <Typography variant="h6" align="center" className="app-title">
          Video Chat
        </Typography>
      </AppBar>

      <main className="app-main">
        <section className="app-main__video">
          <VideoPlayer />
        </section>

        <aside className="app-main__sidebar">
          <Sidebar>
            <Notifications />
          </Sidebar>
        </aside>
      </main>
    </div>
  );
};

export default App;
