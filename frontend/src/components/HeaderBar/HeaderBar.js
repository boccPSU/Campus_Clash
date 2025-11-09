import React, { useEffect, useState } from "react";
import { Navbar, Container, Placeholder } from "react-bootstrap";
import { PersonCircle, Bell } from "react-bootstrap-icons";
import { useNavigate, useLocation } from "react-router-dom";

function HeaderBar({ title = "Screen", xp = 0, collapsed = false }) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(t);
  }, []);

  const handleProfile = () => {
    console.log("Origin Path: ", location.pathname);
    navigate("/profile", {
      state: {
        returnPath: location.pathname
      }
    });
  }

  return (
    <Navbar
      className={`headerBar ${collapsed ? "is-collapsed" : ""}`}
      role="banner"
      aria-label="Home Header"
    >
      <Container>
        <PersonCircle
          size={28}
          className="headerIcon"
          tabIndex={0}
          aria-label="Profile"
          role="button"
          onClick={handleProfile}
        />
        <div className="text-center text-white flex-grow-1">
          <div className="headerTitle">{title}</div>

          <div
            className="headerXp"
            aria-live="polite"
            aria-busy={loading}
          >
            <span>XP: </span>
            {loading ? (
              <Placeholder as="span" animation="glow" className="align-middle">
                <Placeholder
                  className="bg-light opacity-75 rounded-1 d-inline-block"
                  style={{ width: 48, height: "0.5rem" }}
                />
              </Placeholder>
            ) : (
              <span>{Number(xp).toLocaleString()}</span>
            )}
          </div>
        </div>

        <Bell
          size={22}
          className="headerIcon"
          tabIndex={0}
          aria-label="Notifications"
          role="button"
        />
      </Container>
    </Navbar>
  );
}

export default HeaderBar;
