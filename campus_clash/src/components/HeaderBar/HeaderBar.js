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
        <Navbar className="headerBar" role="banner" aria-label={`${title} Header`}>
            <Container>
                <PersonCircle size={28} className="headerIcon" tabIndex={0} aria-label="Profile" role="button" />
                <div className="text-center text-white flex-grow-1">
                    <div className="headerTitle">{title}</div>

                    <div
                        className="headerXp"
                        aria-live="polite"  // For accessability
                        aria-busy={loading} // For accessability
                    >
                        <span>XP: </span>
                        {loading ? (
                            // If loading, show placeholder over XP number
                            <Placeholder
                                as="span"
                                animation="glow"
                                className="align-middle"
                            >
                                {/* If not loading show actual number */}
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

                <Bell size={22} className="headerIcon" tabIndex={0} aria-label="Notifications" role="button"/>
            </Container>
        </Navbar>
    );
}

export default HeaderBar;
