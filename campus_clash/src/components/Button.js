// Regular buttons not used in bottom navigation bar
import React from "react";
import { Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";

// Takes in bootstrap icon, location to navigate to, bottom label, icon   size, and T or F for exact active path 
function NavButton({ label, to, size = 22, exact = false }) {
  const baseStyle = { fontSize: "0.65rem", color: "#000000ff" };

  return (
    <Nav.Item class = "button">
      <Nav.Link
        as={NavLink}
        to={to}       // Location to navigate to
        end={exact}   // something here?
        className={({ isActive }) => (isActive ? "text-primary" : undefined)}
        style={baseStyle}
        label ={label}
      >
        <div>{label}</div>
      </Nav.Link>
    </Nav.Item>
  );
}

export default NavButton;