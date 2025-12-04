import { Nav } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";

import {
    House,
    Calendar,
    Trophy,
    BarChart,
    Diagram3,
    PersonCircle,
} from "react-bootstrap-icons";

function BottomNavBar({ onNavClick }) {
    const location = useLocation();

    const handleNavClick = (path, event) => {
        if (onNavClick) {
            event.preventDefault();
            onNavClick(path);
        }
        // If no onNavClick is provided, let the normal href navigation happen
    };

    return (
        <>
            <Nav className="bottomNavBar" activeKey={location.pathname}>
                <div>
                    <Nav.Link
                        //href="/leaderboard"
                        as={Link}
                        to="/leaderboard"
                        eventKey="/leaderboard"
                        className="navItem"
                        //onClick={(e) => handleNavClick("/leaderboard", e)}
                    >
                        <BarChart size={24} />
                        <div className="nav-label">Leaderboard</div>
                    </Nav.Link>
                </div>

                <div>
                    <Nav.Link
                        //href="/events"
                        as={Link}
                        to="/profile"
                        eventKey="/profile"
                        className="navItem"
                        //onClick={(e) => handleNavClick("/events", e)}
                    >
                        <PersonCircle size={24} />
                        <div className="nav-label">Profile</div>
                    </Nav.Link>
                </div>

                <div>
                    <Nav.Link
                        //href="/home"
                        as={Link}
                        to="/home"
                        eventKey="/home"
                        className="navItem"
                        //onClick={(e) => handleNavClick("/home", e)}
                    >
                        <House size={24} />
                        <div className="nav-label">Home</div>
                    </Nav.Link>
                </div>

                <div>
                    <Nav.Link
                        //href="/battle"
                        as={Link}
                        to="/battle"
                        eventKey="/battle"
                        className="navItem"
                        //onClick={(e) => handleNavClick("/battle", e)}
                    >
                        <Trophy size={24} />
                        <div className="nav-label">Battle</div>
                    </Nav.Link>
                </div>

                <div>
                    <Nav.Link
                        //href="/tournament"
                        as={Link}
                        to="/tournament"
                        eventKey="/tournament"
                        className="navItem"
                        //onClick={(e) => handleNavClick("/tournament", e)}
                    >
                        <Diagram3 size={24} />
                        <div className="nav-label">Tournament</div>
                    </Nav.Link>
                </div>
            </Nav>
        </>
    );
}

export default BottomNavBar;
