import React from "react";
import { Navbar, Container } from "react-bootstrap";
import { PersonCircle, Bell } from "react-bootstrap-icons";

function HeaderBar({ title = "Screen", xp = 0 }) {
  return (
    <Navbar
      bg="primary"
      variant="dark"
      expand="sm"
      fixed="top"
      className="py-2 shadow-sm"
      style={{ zIndex: 1030 }}
    >
      <Container className="d-flex justify-content-between align-items-center">
        {/* Profile Icon */}
        <PersonCircle size={28} className="text-white" />

        {/* Center: Screen Title + XP */}
        <div className="text-center text-white flex-grow-1">
          <div className="fw-bold fs-5">{title}</div>
          <div className="small">XP: {xp.toLocaleString()}</div>
        </div>

        {/* Notification Icon */}
        <Bell size={22} className="text-white" />
      </Container>
    </Navbar>
  );
}

export default HeaderBar;
