import {useState, useRef} from "react";
import {Navbar, Container} from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import {ArrowLeft} from "react-bootstrap-icons";

import SettingsMain from "../components/SettingsComponents/SettingsMain";
import SettingsProfile from "../components/SettingsComponents/SettingsProfile";
import SettingsNotifs from "../components/SettingsComponents/SettingsNotifs";

function SettingsScreen() {
    const navigate = useNavigate();
    const location = useLocation();

    const returnPath = location.state?.returnPath;

    const [page, setPage] = useState(0);

    const handleBack = () => {
        navigate(returnPath ?? "/home");
    }

    const renderPage = () => {
        switch (page) {
            case 0:
                return <SettingsMain setPage={setPage}></SettingsMain>
            case 1:
                return <SettingsProfile setPage={setPage}></SettingsProfile>
            case 2:
                return <SettingsNotifs setPage={setPage}></SettingsNotifs>
        }
    }

    return (
        <>
            <Navbar
                className={`headerBar`}
                role="banner"
                aria-label="Settings Header"
                >
                <Container>
                    <ArrowLeft
                    size={28}
                    className="headerIcon"
                    tabIndex={0}
                    aria-label="Back"
                    role="button"
                    onClick={handleBack}
                    />
                    <div className="text-center text-white flex-grow-1">
                        <div className="headerTitle">{"Settings"}</div>
                    </div>
                </Container>
            </Navbar>

            <div
                className={`headerSpacer`}
            />

            <div>
                {renderPage()}
            </div>
        </>
    )
}
export default SettingsScreen;