import React, { useEffect, useState } from "react";
import { Navbar, Container, Placeholder } from "react-bootstrap";
import { PersonCircle, Bell } from "react-bootstrap-icons";

function HeaderBar({ title = "Screen", xp = 0 }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(t);
  }, []);

  return (
    <Navbar className="headerBar">
      <Container className="d-flex justify-content-between align-items-center">
        <PersonCircle size={28} className="headerIcon" />

        <div className="text-center text-white flex-grow-1">
          <div className="headerTitle">{title}</div>

          <div className="headerXp" aria-live="polite" aria-busy={loading}>
            <span>XP: </span>
            {loading ? (
              // only skeleton the number
              <Placeholder as="span" animation="glow" className="align-middle">
                {/* set a fixed width so layout doesn't jump */}
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

        <Bell size={22} className="headerIcon" />
      </Container>
    </Navbar>
  );
}

export default HeaderBar;
