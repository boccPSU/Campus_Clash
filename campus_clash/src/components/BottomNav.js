// This file defines the bottom navigation bar as a component to be used on every screen

import React from "react";
import { Nav } from "react-bootstrap";

//import the icon designs used on the nav bar
import {
  HouseDoorFill,
  CalendarEventFill,
  TrophyFill,
  PersonFill,
  BarChartFill,
} from "react-bootstrap-icons";

//used for switching between the screens when the buttons are pressed
import { useNavigate, useLocation } from "react-router-dom";

function BottomNav() {
  const navigate = useNavigate();   // allows navigation between routes
  const location = useLocation();   // tracks what page you are currently on

  //checks if a button is for the current
  const isActive = (path) => location.pathname === path;

  // style for the text under each icon
  const navStyle = {
    fontSize: "0.75rem",
    color: "#333",
  };

  return (
    // Nav is  a component from bootstrap that makes vertical navigation easy
    // the line directly below sets the position of buttons and background of the nav bar 
    <Nav className="justify-content-around bg-light fixed-bottom border-top py-2">
      {/* definition of the leaderboard button */}
      <Nav.Item>
        <Nav.Link
          style={navStyle}
          // sets color to blue if the page is currently active
          className={isActive("/leaderboard") ? "text-primary" : ""}
          onClick={() => navigate("/leaderboard")}
        >
            {/* definition of the leaderboard icon */}
          <BarChartFill size={22} />
          <div>Leaderboard</div>
        </Nav.Link>
      </Nav.Item>

      {/*  definition of the events button */}
      <Nav.Item>
        <Nav.Link
          style={navStyle}
          className={isActive("/events") ? "text-primary" : ""}
          onClick={() => navigate("/events")}
        >
            {/* definition of the events icon */}
          <CalendarEventFill size={22} />
          <div>Events</div>
        </Nav.Link>
      </Nav.Item>

      {/*  definition of the home button */}
      <Nav.Item>
        <Nav.Link
          style={navStyle}
          className={isActive("/") ? "text-primary" : ""}
          onClick={() => navigate("/")}
        >
            {/* definition of the home icon */}
          <HouseDoorFill size={26} />
          <div>Home</div>
        </Nav.Link>
      </Nav.Item>

      {/*  definition of the battle button */}
      <Nav.Item>
        <Nav.Link style={navStyle}>
            {/* definition of the battle icon */}
          <TrophyFill size={22} />
          <div>Battle</div>
        </Nav.Link>
      </Nav.Item>

      {/*  definition of the tournament button */}
      <Nav.Item>
        <Nav.Link style={navStyle}>
            {/* definition of the tournament icon */}
          <PersonFill size={22} />
          <div>Tournament</div>
        </Nav.Link>
      </Nav.Item>
    </Nav>
  );
}

export default BottomNav;
