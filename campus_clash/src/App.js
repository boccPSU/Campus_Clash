import React from "react";

// import routing tools to switch between pages
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

//needed to use bootstrap components
import "bootstrap/dist/css/bootstrap.min.css";

// import all currently finished screens
import HomeScreen from "./screens/HomeScreen";
import EventsScreen from "./screens/EventsScreen";

function App() {
  return (
    // defines the routes for navigation through the app, currently only home and events screen are working
    <Router>
      {/*sets each screen to a distict url within the app */}
      <Routes>
        {/* sets the home screen to the default path */}
        <Route path="/" element={<HomeScreen />} />
        {/* sets the /events path to the events page*/}
        <Route path="/events" element={<EventsScreen />} />
      </Routes>
    </Router>
  );
}

export default App;
