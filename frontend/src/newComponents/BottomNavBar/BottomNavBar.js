import { Nav } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";

import {
    House,
    Calendar,
    Trophy,
    BarChart,
    Diagram3,
    Person,
} from "react-bootstrap-icons";

function BottomNavBar({ onNavClick }) {
    const location = useLocation();

    const handleNavClick = (path, event) => {
        if (onNavClick) {
            event.preventDefault();   // stop immediate navigation
            onNavClick(path);         // let the screen decide (show popup, etc.)
        }
        // if no onNavClick, do nothing; Link will handle navigation normally
    };

    return (
        <Nav className="bottomNavBar" activeKey={location.pathname}>
            <div>
                <Nav.Link
                    as={Link}
                    to="/profile"
                    eventKey="/profile"
                    className="navItem"
                    onClick={(e) => handleNavClick("/profile", e)}
                >
                    <Person size={24} />
                    <div className="nav-label">Profile</div>
                </Nav.Link>
            </div>

            <div>
                <Nav.Link
                    as={Link}
                    to="/leaderboard"
                    eventKey="/leaderboard"
                    className="navItem"
                    onClick={(e) => handleNavClick("/leaderboard", e)}
                >
                    <BarChart size={24} />
                    <div className="nav-label">Leaderboard</div>
                </Nav.Link>
            </div>

            <div>
                <Nav.Link
                    as={Link}
                    to="/home"
                    eventKey="/home"
                    className="navItem"
                    onClick={(e) => handleNavClick("/home", e)}
                >
                    <House size={24} />
                    <div className="nav-label">Home</div>
                </Nav.Link>
            </div>

            <div>
                <Nav.Link
                    as={Link}
                    to="/battle"
                    eventKey="/battle"
                    className="navItem"
                    onClick={(e) => handleNavClick("/battle", e)}
                >
                    <Trophy size={24} />
                    <div className="nav-label">Battle</div>
                </Nav.Link>
            </div>

            <div>
                <Nav.Link
                    as={Link}
                    to="/tournament"
                    eventKey="/tournament"
                    className="navItem"
                    onClick={(e) => handleNavClick("/tournament", e)}
                >
                    <Diagram3 size={24} />
                    <div className="nav-label">Tournament</div>
                </Nav.Link>
            </div>
        </Nav>
    );
}

export default BottomNavBar;
