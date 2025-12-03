import React, { useEffect, useRef, useState } from "react";
import { Container, Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import BottomNavBar from "../../newComponents/BottomNavBar/BottomNavBar.js";
import InfoTile from "../../newComponents/InfoTile/InfoTile.js";
import CourseCard from "../../components/CourseCard/CourseCard.js";
import AlertCard from "../../components/AlertCard/AlertCard.js";
import PullToRefresh from "../../components/interaction/PullToRefresh.js";
import ScreenScroll from "../../components/ScreenScroll/ScreenScroll.js";

import { computeGPAEqualCredits, percentToLetter } from "../../utils/gpa.js";
import { getUpcomingAssignmentAlerts } from "../../api/canvas.js";
import { getMySemesterCoursesWithGrades } from "../../api/canvas.js";
import { Bell, ChevronDown, ChevronUp } from "react-bootstrap-icons";
import { checkRecentSubmissions } from "../../api/canvas.js";
import XpHeaderBar from "../../newComponents/XpHeaderBar/XpHeaderBar.js";
import MainPopup from "../../newComponents/MainPopup/MainPopup.js";

const COURSES_PREVIEW_COUNT = 3;
const ALERTS_PREVIEW_COUNT = 3;

function NewHomeScreen() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [alertsLoading, setAlertsLoading] = useState(true);
    const [alerts, setAlerts] = useState([]);

    const [studentData, setStudentData] = useState(
        JSON.parse(sessionStorage.getItem("studentData"))
    );

    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showAllCourses, setShowAllCourses] = useState(false);
    const [showAllAlerts, setShowAllAlerts] = useState(false);

    useEffect(() => {
        sessionStorage.setItem("studentData", JSON.stringify(studentData));
    }, [studentData]);

    // Toggle dark mode on "d" / "D"
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key && e.key.toLowerCase() === "d") {
                setIsDarkMode((prev) => !prev);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Apply/remove class on <body>
    useEffect(() => {
        document.body.classList.toggle("dark-mode", isDarkMode);
    }, [isDarkMode]);

    const scrollerRef = useRef(null);

    const loadCourses = async () => {
        setError("");
        setLoading(true);
        try {
            const raw = await getMySemesterCoursesWithGrades();

            const nextGpa = computeGPAEqualCredits(
                raw.map((c) => ({ grade: c.grade, percent: c.percent }))
            );

            const normalizedForUI = raw.map((c) => {
                const rawPercent =
                    typeof c.percent === "number" ? c.percent : null;
                const roundedPercent =
                    rawPercent !== null ? Math.round(rawPercent) : undefined;
                const letter = c.grade || percentToLetter(rawPercent) || "—";
                return {
                    id: c.id,
                    name: c.name ?? `Course ${c.id}`,
                    percent: roundedPercent,
                    grade: letter,
                };
            });

            setStudentData((prevStudent) => ({
                ...prevStudent,
                gpa: nextGpa,
                courses: normalizedForUI,
                filled: true,
            }));
            console.log("Student Data Post-Course Load: ", studentData);
        } catch (e) {
            console.error("Failed to load Canvas data:", e);
            setError(
                `Could not load courses from Canvas.\n${e?.message ?? ""}`
            );
            setStudentData((prevStudent) => ({
                ...prevStudent,
                courses: [],
            }));
        } finally {
            setLoading(false);
        }
    };

    const loadAlerts = async () => {
        try {
            setAlertsLoading(true);
            const upcoming = await getUpcomingAssignmentAlerts({
                daysAhead: 14,
            });
            setAlerts(upcoming);
            setStudentData((prevStudent) => ({
                ...prevStudent,
                alerts: upcoming,
                filled: true,
            }));
            console.log("Student Data Post-Alerts Load: ", studentData);
        } catch (e) {
            console.error("Failed to load upcoming assignments:", e);
            setAlerts([]);
        } finally {
            setAlertsLoading(false);
        }
    };

    useEffect(() => {
        (async () => {
            let studentDataToken = JSON.parse(
                sessionStorage.getItem("studentData")
            );
            console.log(studentDataToken);
            if (studentDataToken?.filled ?? false) {
                setStudentData(studentDataToken);
                setLoading(false);
                setAlertsLoading(false);
            } else {
                await setTokens();
                await loadCourses();
                await loadAlerts();
                await checkRecentSubmissions({ lookbackMinutes: 60 * 24 * 7 });
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const refresh = async () => {
        await setTokens();
        await loadCourses();
        await loadAlerts();
        await checkRecentSubmissions({ lookbackMinutes: 60 * 24 * 7 });
        await new Promise((r) => setTimeout(r, 300));
    };

    const setTokens = async () => {
        try {
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
            if (res.status == 500)
                throw new Error("[PROFILE] Error", {
                    cause: "Could not Connect.",
                });
            const data = await res.json();
            if (!res.ok)
                throw new Error("[PROFILE] Error", { cause: data.error });
            console.log(data);
            setStudentData((prevStudent) => ({
                ...prevStudent,
                username: data.username,
                university: data.university,
                major: data.major,
                xp: data.xp,
                filled: true,
            }));
        } catch (err) {
            console.log(err);
            setError(err.cause);
        }
    };

    const courses = studentData?.courses ?? [];
    const alertsData = studentData?.alerts ?? [];

    const visibleCourses = showAllCourses
        ? courses
        : courses.slice(0, COURSES_PREVIEW_COUNT);

    const visibleAlerts = showAllAlerts
        ? alertsData
        : alertsData.slice(0, ALERTS_PREVIEW_COUNT);

    return (
        <>
            <ScreenScroll ref={scrollerRef}>
                <PullToRefresh scrollerRef={scrollerRef} onRefresh={refresh}>
                    <Container className="mainContainer">
                        {/* Level Up Popup (should be on each screen) */}
                        <MainPopup
                            open={false}
                            title="Congrats, you leveled up!"
                            message="Next level unlocked at 1500 XP."
                            buttonLabel1="Leave"
                            buttonLabel2="Stay"
                            onButton1={"handleLeave"}
                            onButton2={"handleStay"}
                            
                        >
                            {/* optional extra content here */}
                        </MainPopup>

                        {/* Quest Popup */}
                        <MainPopup
                            open={true}
                            title="Quests"
                            message="Claim a quest to earn gems"
                            buttonLabel1="Leave"
                            buttonLabel2="Stay"
                            onButton1={"handleLeave"}
                            onButton2={"handleStay"}
                            
                        >
                            <button> Refresh Quest 50 gems</button>
                            <InfoTile>
                                Quest 1: Complete 3 assignments this week - 100 gems
                            </InfoTile>
                            <InfoTile>
                                Quest 2: Study for 5 hours this week - 75 gems
                            </InfoTile>
                            <InfoTile>
                                Quest 3: Participate in 2 battles this week - 150 gems
                            </InfoTile>
                        </MainPopup>

                        <XpHeaderBar
                            level={4}
                            currentXp={1200}
                            xpForNextLevel={1500}
                        ></XpHeaderBar>
                        <div className="homeHeader">
                            <div className="homeHeader-text">
                                <h1 className="homeHeaderGreeting">
                                    Welcome back,{" "}
                                    {studentData?.username ?? "Scholar"}
                                </h1>
                            </div>
                            <button
                                type="button"
                                className="homeHeader-notifications"
                                aria-label="Notifications"
                            >
                                <Bell size={22} />
                            </button>
                        </div>

                        <InfoTile>
                            <div className="gpaSection">
                                <h3>GPA {studentData?.gpa ?? "—"}</h3>
                                <h3>
                                    Battle Team: {studentData?.major ?? "-"}
                                </h3>
                            </div>
                        </InfoTile>

                        <h1 className="sectionTitle">Courses</h1>

                        {loading && (
                            <InfoTile>
                                <div
                                    className="d-flex align-items-center gap-2 py-2"
                                    aria-live="polite"
                                >
                                    <Spinner
                                        animation="border"
                                        role="status"
                                        size="sm"
                                    />
                                    <span>Loading courses…</span>
                                </div>
                            </InfoTile>
                        )}

                        {!loading && error && (
                            <InfoTile>
                                <div
                                    className="d-flex flex-column gap-2"
                                    role="alert"
                                >
                                    <div
                                        className="text-danger"
                                        style={{ whiteSpace: "pre-wrap" }}
                                    >
                                        {error}
                                    </div>
                                    <div>
                                        <Button
                                            size="sm"
                                            variant="outline-secondary"
                                            onClick={loadCourses}
                                        >
                                            Try again
                                        </Button>
                                    </div>
                                </div>
                            </InfoTile>
                        )}

                        {!loading &&
                            !error &&
                            (!courses || courses.length === 0) && (
                                <InfoTile>
                                    <div className="text-muted">
                                        No active courses found.
                                    </div>
                                </InfoTile>
                            )}

                        {!loading &&
                            !error &&
                            visibleCourses.map((c, i) => (
                                <InfoTile key={c.id ?? i}>
                                    <CourseCard {...c} />
                                </InfoTile>
                            ))}

                        {!loading &&
                            !error &&
                            courses.length > COURSES_PREVIEW_COUNT && (
                                <div className="expandToggleWrapper">
                                    <button
                                        type="button"
                                        className="expandToggleIcon"
                                        onClick={() =>
                                            setShowAllCourses((prev) => !prev)
                                        }
                                        aria-label={
                                            showAllCourses
                                                ? "Show fewer courses"
                                                : "Show all courses"
                                        }
                                    >
                                        {showAllCourses ? (
                                            <ChevronUp />
                                        ) : (
                                            <ChevronDown />
                                        )}
                                    </button>
                                </div>
                            )}

                        <div className="d-flex justify-content-between mt-3">
                            <Button
                                className="button"
                                onClick={() => navigate("/progressReport")}
                            >
                                Progress Report
                            </Button>
                            <Button
                                className="button"
                                onClick={() => navigate("/studyPlan")}
                            >
                                Study Plan
                            </Button>
                        </div>

                        <h1 className="sectionTitle">Alerts</h1>

                        {alertsLoading && (
                            <InfoTile>
                                <AlertCard
                                    alertTitle="Loading alerts…"
                                    alertInfo="Fetching upcoming items"
                                />
                            </InfoTile>
                        )}

                        {!alertsLoading &&
                            (!alertsData || alertsData.length === 0) && (
                                <InfoTile>
                                    <div className="text-muted">
                                        No upcoming graded items in the next 14
                                        days.
                                    </div>
                                </InfoTile>
                            )}

                        {!alertsLoading &&
                            visibleAlerts.map((a) => (
                                <InfoTile key={a.id}>
                                    <AlertCard
                                        alertTitle={`${a.type}: ${a.title}`}
                                        alertInfo={`${a.courseName} • Due ${a.dueLabel}`}
                                    />
                                </InfoTile>
                            ))}

                        {!alertsLoading &&
                            alertsData.length > ALERTS_PREVIEW_COUNT && (
                                <div className="expandToggleWrapper">
                                    <button
                                        type="button"
                                        className="expandToggleIcon"
                                        onClick={() =>
                                            setShowAllAlerts((prev) => !prev)
                                        }
                                        aria-label={
                                            showAllAlerts
                                                ? "Show fewer alerts"
                                                : "Show all alerts"
                                        }
                                    >
                                        {showAllAlerts ? (
                                            <ChevronUp />
                                        ) : (
                                            <ChevronDown />
                                        )}
                                    </button>
                                </div>
                            )}
                    </Container>
                </PullToRefresh>
                
                <div style={{ height: "var(--bottom-nav-height, 72px)" }} />
            </ScreenScroll>

            <BottomNavBar />
        </>
    );
}

export default NewHomeScreen;
