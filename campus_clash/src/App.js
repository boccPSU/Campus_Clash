import React from "react";

// import routing tools to switch between pages
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// needed to use bootstrap components
import "bootstrap/dist/css/bootstrap.min.css";

// import all currently finished screens
import HomeScreen from "./screens/HomeScreen";
import EventsScreen from "./screens/EventsScreen";
import LeaderboardScreen from "./screens/LeaderboardScreen";
import TournamentScreen from "./screens/TournamentScreen";

function App() {
  return (
    // defines the routes for navigation through the app
    <Router>
      {/* sets each screen to a distinct URL within the app */}
      <Routes>
        {/* default path -> Home */}
        <Route path="/" element={<HomeScreen />} />

        {/* /events path -> Events screen */}
        <Route path="/events" element={<EventsScreen />} />
        
        {/* /tournaments path -> Tournament screen */}
        <Route path="/tournament" element={<TournamentScreen />} />

        {/* /leaderboard path -> Leaderboard screen */}
        <Route path="/leaderboard" element={<LeaderboardScreen />} />
      </Routes>
    </Router>
  );
}

export default App;
