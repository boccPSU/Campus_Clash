import React, {useEffect, useRef, useState } from "react";
import { Container, Navbar, Button} from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import { Gear, ArrowLeft} from "react-bootstrap-icons";

import useCollapseOnScroll from "../../components/hooks/useCollapseOnScroll.js";
import PullToRefresh from "../../components/interaction/PullToRefresh.js";
import ScreenScroll from "../../components/ScreenScroll/ScreenScroll.js";
import ProfileInfo from "../../components/ProfileInfo/ProfileInfo.js";
import LogoutButton from "../../components/LogoutButton/LogoutButton.js";
import SettingsButton from "../../components/SettingsComponents/SettingsButton/SettingsButton.js";
import './ProfileScreen.scss';
import { useAuth } from "../../api/AuthContext.js";

function ProfileScreen() {
    const navigate = useNavigate();
    const location = useLocation();

    const {logout} = useAuth();

    const [user, setUser] = useState({
        firstName: "",
        lastName: "",
        username: "",
        university: "",
        major: "",
        xp: ""
    })

    const returnPath = location.state?.returnPath;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState();

    // collapse header / pull-to-refresh
    const scrollerRef = useRef(null);
    const collapsed = useCollapseOnScroll(scrollerRef);

    useEffect(() => {
        (async () => {
            await loadUser();
        })();
    }, []);

    const loadUser = async () => {
        try {
            //Get user token
            const tokenString = localStorage.getItem("token");
            const userToken = JSON.parse(tokenString);
            const tokenValue = userToken.token;
            const res = await fetch("/api/profile", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "jwt-token": tokenValue,
                },
            });
            if (res.status == 500) throw new Error("[PROFILE] Error", {cause: "Could not Connect."});
            const data = await res.json();
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
        await loadUser();
    };

    const handleBack = () => {
        navigate(returnPath ?? "/home");
    };

    const handleLogout = async () => {
        logout();
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
                    <ProfileInfo user={user}></ProfileInfo>
                </PullToRefresh>
                <div className="center">
                    <SettingsButton></SettingsButton>
                    <LogoutButton handleLogout={handleLogout}></LogoutButton>
                </div>
            </ScreenScroll>
        </>
    );
}

export default ProfileScreen;
