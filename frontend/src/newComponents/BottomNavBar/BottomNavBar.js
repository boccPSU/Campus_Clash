import { Nav } from "react-bootstrap";
import { useLocation } from "react-router-dom";

import {
    House,
    Calendar,
    Trophy,
    BarChart,
    Diagram3,
} from "react-bootstrap-icons";

function BottomNavBar() {
    // Used to highlight active nav item
    const location = useLocation();               

    return (
        <Nav className="bottomNavBar" activeKey={location.pathname}>
            <div>
                <Nav.Link
                    href="/leaderboard"
                    eventKey="/leaderboard"
                    className="navItem"
                >
                    <BarChart size={24} />
                    <div className="nav-label">Leaderboard</div>
                </Nav.Link>
            </div>

            <div>
                <Nav.Link
                    href="/events"
                    eventKey="/events"
                    className="navItem"
                >
                    <Calendar size={24} />
                    <div className="nav-label">Events</div>
                </Nav.Link>
            </div>

            <div>
                <Nav.Link
                    href="/home"
                    eventKey="/home"
                    className="navItem"
                >
                    <House size={24} />
                    <div className="nav-label">Home</div>
                </Nav.Link>
            </div>

            <div>
                <Nav.Link
                    href="/battle"
                    eventKey="/battle"
                    className="navItem"
                >
                    <Trophy size={24} />
                    <div className="nav-label">Battle</div>
                </Nav.Link>
            </div>

            <div>
                <Nav.Link
                    href="/tournament"
                    eventKey="/tournament"
                    className="navItem"
                >
                    <Diagram3 size={24} />
                    <div className="nav-label">Tournament</div>
                </Nav.Link>
            </div>
        </Nav>
    );
}

export default BottomNavBar;
