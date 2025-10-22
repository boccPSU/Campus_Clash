//Button that when clicked will navigate to another screen or menue
import React from "react";
import { Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";

// Takes in bootstrap icon, location to navigate to, bottom label, icon   size, and T or F for exact active path
function NavButton({ icon: Icon, to, label, size = 22, exact = false }) {
    const baseStyle = { fontSize: "0.65rem", color: "#000000ff" };

    return (
        <Nav.Item className="navButton">
            <Nav.Link
                as={NavLink}
                to={to} // Location to navigate to
                end={exact} // something here?
                className={({ isActive }) =>
                    isActive ? "text-primary" : undefined
                }
                style={baseStyle}
                aria-label={label} // Bottom button label
            >
                <Icon size={size} />
                <div>{label}</div>
            </Nav.Link>
        </Nav.Item>
    );
}

export default NavButton;
