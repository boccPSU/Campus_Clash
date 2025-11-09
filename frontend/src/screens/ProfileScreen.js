import React, {useEffect, useRef, useState } from "react";
import { Container, Navbar} from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import { PersonCircle, ArrowLeft} from "react-bootstrap-icons";

import useCollapseOnScroll from "../components/hooks/useCollapseOnScroll.js";
import PullToRefresh from "../components/interaction/PullToRefresh.js";
import ScreenScroll from "../components/ScreenScroll/ScreenScroll.js";

function ProfileScreen() {
    const navigate = useNavigate();
    const location = useLocation();

    const returnPath = location.state?.returnPath;

    console.log("Profile Path: ", returnPath);

    const [loading, setLoading] = useState(true);

    // collapse header / pull-to-refresh
    const scrollerRef = useRef(null);
    const collapsed = useCollapseOnScroll(scrollerRef);

    // pull-to-refresh
    const refresh = async () => {

    };

    const handleBack = () => {
        console.log("Location: ", location);
        console.log("Return Path: ", returnPath);
        navigate(returnPath ?? "/home");
    };

    return (
        <>
            <Navbar
                className={`headerBar ${collapsed ? "is-collapsed" : ""}`}
                role="banner"
                aria-label="Profile Header"
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
                    <div className="headerTitle">{"Profile"}</div>

                    </div>
                </Container>
            </Navbar>

            <ScreenScroll ref={scrollerRef}>
                <PullToRefresh scrollerRef={scrollerRef} onRefresh={refresh}>
                    <Container className="py-3">

                    </Container>
                </PullToRefresh>

                <div style={{ height: "var(--bottom-nav-height, 72px)" }} />
            </ScreenScroll>
        </>
    );
}

export default ProfileScreen;
