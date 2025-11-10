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

    const [user, setUser] = useState({
        firstName: "",
        lastName: "",
        username: "",
        university: "",
        major: "",
        xp: ""
    })

    const returnPath = location.state?.returnPath;

    console.log("Profile Path: ", returnPath);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState();

    // collapse header / pull-to-refresh
    const scrollerRef = useRef(null);
    const collapsed = useCollapseOnScroll(scrollerRef);

    const useEffect = (() => {
        (async () => {
            //await loadUser();
        })();
    }, []);

    const loadUser = async () => {
        try {
            //Get user token
            const tokenString = localStorage.getItem("token");
            const userToken = JSON.parse(tokenString);
            const tokenValue = userToken.token;
            const getUserRes = await fetch("/api/current-user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "jwt-token": tokenValue,
                },
            });
            if (getUserRes.status == 500) throw new Error("[PROFILE] Error", {cause: "Could not Connect."});
            const username = await getUserRes.json().username;
            const res = await fetch("/api/profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(username)
            });
            if (res.status == 500) throw new Error("[PROFILE] Error", {cause: "Could not Connect."});
            const data = res.json();
            if (!res.ok) throw new Error("[PROFILE] Error", {cause: data.error});
            setUser({
                firstName: data.firstName,
                lastName: data.lastName,
                username: data.username,
                university: data.university,
                major: data.major,
                xp: data.xp
            });
        } catch(e) {
            console.log(e);
            setError(e.cause);
        }
    }

    // pull-to-refresh
    const refresh = async () => {

    };

    const handleBack = () => {
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

            <div
                className={`headerSpacer ${collapsed ? "is-collapsed" : ""}`}
            />
            {error && (
                        <div className="text-danger">{error}</div>
            )}
            <ScreenScroll ref={scrollerRef}>
                <PullToRefresh scrollerRef={scrollerRef} onRefresh={refresh}>
                    <div className="profile m-3 p-3 d-flex flex-column rounded bg-dark justify-content-center align-items-center" style={{height: "50vh"}}>
                        <PersonCircle
                            className="ProfileIcon text-light"
                            aria-label="Profile"
                            role="img"
                            style={{width:"60%", height:"60%"}}

                        />
                        <h2 className="text-light">{user.username}</h2>
                    </div>
                </PullToRefresh>

                <div style={{ height: "var(--bottom-nav-height, 72px)" }} />
            </ScreenScroll>
        </>
    );
}

export default ProfileScreen;
