import React from "react";
import { Navbar, Container } from "react-bootstrap";
import { PersonCircle, Bell } from "react-bootstrap-icons";

// Top header bar shown across multiple screens
function HeaderBar({ title = "Screen", xp = 0 }) {
  return (
    <Navbar className="headerBar">
      <Container className="d-flex justify-content-between align-items-center">
        {/* Left: User profile icon */}
        <PersonCircle size={28} className="headerIcon" />

        {/* Center: Screen title and XP display */}
        <div className="text-center text-white flex-grow-1">
          <div className="headerTitle">{title}</div>
          <div className="headerXp">XP: {xp.toLocaleString()}</div>
        </div>

        {/* Right: Notifications icon */}
        <Bell size={22} className="headerIcon" />
      </Container>
    </Navbar>
  );
}

export default HeaderBar;
