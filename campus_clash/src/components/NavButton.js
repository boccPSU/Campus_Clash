//Button that when clicked will navigate to another screen or menue
import React from "react";
import { Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";

function NavButton({ icon: Icon, to, label, size = 22, exact = false }) {
  const baseStyle = { fontSize: "0.75rem", color: "#000000ff" };

  return (
    <Nav.Item>
      <Nav.Link
        as={NavLink}
        to={to}
        end={exact}
        className={({ isActive }) => (isActive ? "text-primary" : undefined)}
        style={baseStyle}
        aria-label={label}
      >
        <Icon size={size} />
        <div>{label}</div>
      </Nav.Link>
    </Nav.Item>
  );
}

export default NavButton;