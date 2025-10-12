import React from "react";
import { Navbar, Container } from "react-bootstrap";
import { PersonCircle, Bell } from "react-bootstrap-icons";

function HeaderBar({ title = "Screen", xp = 0 }) {
  return (
    <Navbar className = "headerBar">
      <Container className="d-flex justify-content-between align-items-center">
        {/* Profile Icon */}
        <PersonCircle size={28} className="headerIcon" />

        {/* Center: Screen Title + XP */}
        <div className="text-center text-white flex-grow-1">
          <div className="headerTitle">{title}</div>
          <div className="headerXp">XP: {xp.toLocaleString()}</div>
        </div>

        {/* Notification Icon */}
        <Bell size={22} className="headerIcon" />
      </Container>
    </Navbar>
  );
}

export default HeaderBar;
