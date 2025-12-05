import React, { useEffect, useRef, useState } from "react";
import { Container, Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import BottomNavBar from "../../newComponents/BottomNavBar/BottomNavBar.js";
import InfoTile from "../../newComponents/InfoTile/InfoTile.js";
import CourseCard from "../../components/CourseCard/CourseCard.js";
import AlertCard from "../../components/AlertCard/AlertCard.js";
import PullToRefresh from "../../components/interaction/PullToRefresh.js";
import ScreenScroll from "../../components/ScreenScroll/ScreenScroll.js";
import SettingsEditWindow from "../../components/SettingsComponents/SettingsEditWindow.js";

import { Bell, ChevronDown, ChevronUp } from "react-bootstrap-icons";
import XpHeaderBar from "../../newComponents/XpHeaderBar/XpHeaderBar.js";
import MainPopup from "../../newComponents/MainPopup/MainPopup.js";

import { useAuth } from "../../api/AuthContext.js";

const COURSES_PREVIEW_COUNT = 3;
const ALERTS_PREVIEW_COUNT = 3;

// Leveling constraints (same as XpHeaderBar)
const BASE_XP_PER_LEVEL = 200;
const XP_INCREMENT_PER_LEVEL = 100;
const GEMS_PER_LEVEL = 50;

// Helper function to compute level info based on total xp
function computeLevelInfo(totalXp) {
    let level = 1;
    let xpRemaining = totalXp;
    let costForNextLevel = BASE_XP_PER_LEVEL;

    while (xpRemaining >= costForNextLevel) {
        xpRemaining -= costForNextLevel;
        level += 1;
        costForNextLevel += XP_INCREMENT_PER_LEVEL;
    }

    return {
        level,
        currentXp: xpRemaining,
        xpForNextLevel: costForNextLevel,
    };
}

function NewHomeScreen() {
    const navigate = useNavigate();

    const {
        studentData,
        setStudentData,
        loadStudentData,
        isStudentDataFilled,
        studentDataLoading,
        coursesLoading,
        alertsLoading,
        canvasError,
    } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    //const [alertsLoading, setAlertsLoading] = useState(true);
    const [alerts, setAlerts] = useState([]);

    // Track level + popup
    const [lastLevel, setLastLevel] = useState(null);
    const [showLevelUpPopup, setShowLevelUpPopup] = useState(false);
    const [justLeveledTo, setJustLeveledTo] = useState(null);
    const [levelUpGemsAwarded, setLevelUpGemsAwarded] = useState(0);

    // const [studentData, setStudentData] = useState(
    //     JSON.parse(sessionStorage.getItem("studentData"))
    // );

    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showAllCourses, setShowAllCourses] = useState(false);
    const [showAllAlerts, setShowAllAlerts] = useState(false);

    // useEffect(() => {
    //     sessionStorage.setItem("studentData", JSON.stringify(studentData));
    // }, [studentData]);

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
    useEffect(() => {
    // Wait until we have studentData and XP
    if (!studentData || typeof studentData.xp !== "number") {
        return;
    }

    const totalXp = studentData.xp;
    const { level } = computeLevelInfo(totalXp);

    // Use a per-user key so if user A logs out and B logs in, the levels don’t mix
    const levelKey = studentData.username
        ? `lastLevel_${studentData.username}`
        : "lastLevel";

    // On first run, initialize lastLevel from storage or from current level
    if (lastLevel === null) {
        const stored = sessionStorage.getItem(levelKey);
        const initialLevel = stored ? parseInt(stored, 10) : level;
        setLastLevel(initialLevel);
        if (!stored) {
            sessionStorage.setItem(levelKey, String(initialLevel));
        }
        return;
    }

    // If level did not change, nothing to do
    if (level <= lastLevel) {
        return;
    }

    // We leveled up  
    const levelsGained = level - lastLevel;
    const gemsToAward = levelsGained * GEMS_PER_LEVEL;

    console.log(
        `[HOME] Level up detected: lastLevel=${lastLevel}, newLevel=${level}, levelsGained=${levelsGained}, gemsToAward=${gemsToAward}`
    );

    setJustLeveledTo(level);
    setLevelUpGemsAwarded(gemsToAward);
    setShowLevelUpPopup(true);

    // Update local state immediately so we don't re-trigger for same XP
    setLastLevel(level);
    sessionStorage.setItem(levelKey, String(level));

    // Award gems via backend
    (async () => {
        try {
            const username = studentData.username;
            if (!username) {
                console.warn("[HOME] No username for gem award.");
                return;
            }

            const res = await fetch("http://localhost:5000/api/gems/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    amount: gemsToAward,
                }),
            });

            if (!res.ok) {
                console.error(
                    "[HOME] Failed to award gems on level up:",
                    res.status,
                    res.statusText
                );
                return;
            }

            const data = await res.json().catch(() => ({}));
            console.log("[HOME] Gems awarded on level up:", data);

            // Optimistically update gems in context so XpHeaderBar updates immediately
            const prevGems = Number(studentData.gems) || 0;
            setStudentData({
                ...studentData,
                gems: prevGems + gemsToAward,
            });
        } catch (err) {
            console.error("[HOME] Error awarding gems on level up:", err);
        }
    })();
}, [studentData, lastLevel, setStudentData]);

    // On mount, make sure studentData is fresh
    useEffect(() => {
        (async () => {
            setLoading(true);
            if (isStudentDataFilled()) {
                console.log(
                    "[HOME] studentData already filled, skipping reload."
                );
                setLoading(false);
            } else {
                console.log(
                    "[HOME] studentData not filled, calling loadStudentData..."
                );
                const err = await loadStudentData();
                if (err) {
                    console.log("[HOME] loadStudentData error:", err);
                    setError(err.cause);
                }
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // const loadCourses = async () => {
    //     setError("");
    //     setLoading(true);
    //     try {
    //         const raw = await getMySemesterCoursesWithGrades();

    //         const nextGpa = computeGPAEqualCredits(
    //             raw.map((c) => ({ grade: c.grade, percent: c.percent }))
    //         );

    //         const normalizedForUI = raw.map((c) => {
    //             const rawPercent =
    //                 typeof c.percent === "number" ? c.percent : null;
    //             const roundedPercent =
    //                 rawPercent !== null ? Math.round(rawPercent) : undefined;
    //             const letter = c.grade || percentToLetter(rawPercent) || "—";
    //             return {
    //                 id: c.id,
    //                 name: c.name ?? `Course ${c.id}`,
    //                 percent: roundedPercent,
    //                 grade: letter,
    //             };
    //         });

    //         setStudentData((prevStudent) => ({
    //             ...prevStudent,
    //             gpa: nextGpa,
    //             courses: normalizedForUI,
    //             filled: true,
    //         }));
    //         console.log("Student Data Post-Course Load: ", studentData);
    //     } catch (e) {
    //         console.error("Failed to load Canvas data:", e);
    //         setError(
    //             `Could not load courses from Canvas.\n${e?.message ?? ""}`
    //         );
    //         setStudentData((prevStudent) => ({
    //             ...prevStudent,
    //             courses: [],
    //         }));
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // const loadAlerts = async () => {
    //     try {
    //         setAlertsLoading(true);
    //         const upcoming = await getUpcomingAssignmentAlerts({
    //             daysAhead: 14,
    //         });
    //         setAlerts(upcoming);
    //         setStudentData((prevStudent) => ({
    //             ...prevStudent,
    //             alerts: upcoming,
    //             filled: true,
    //         }));
    //         console.log("Student Data Post-Alerts Load: ", studentData);
    //     } catch (e) {
    //         console.error("Failed to load upcoming assignments:", e);
    //         setAlerts([]);
    //     } finally {
    //         setAlertsLoading(false);
    //     }
    // };

    // useEffect(() => {
    //     (async () => {
    //         let studentDataToken = JSON.parse(
    //             sessionStorage.getItem("studentData")
    //         );
    //         console.log(studentDataToken);
    //         if (studentDataToken?.filled ?? false) {
    //             setStudentData(studentDataToken);
    //             setLoading(false);
    //             setAlertsLoading(false);
    //         } else {
    //             await setTokens();
    //             await loadCourses();
    //             await loadAlerts();
    //             await checkRecentSubmissions({ lookbackMinutes: 60 * 24 * 7 });
    //         }
    //     })();
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, []);

    // useEffect(() => {
    //         (async () => {
    //             if (isStudentDataFilled()) {
    //                 setLoading(false);
    //             } else {
    //                 setLoading(true);
    //                 loadStudentData().then(
    //                     (err) => {
    //                         if (err) {
    //                             setError(err.cause);
    //                         }
    //                         setLoading(false);
    //                     }
    //                 );
    //             }
    //         })();
    //         // eslint-disable-next-line react-hooks/exhaustive-deps
    //     }, []);

    if (!isStudentDataFilled() && !studentDataLoading) {
        //loadStudentData();
    }

    // const refresh = async () => {
    //     await setTokens();
    //     await loadCourses();
    //     await loadAlerts();
    //     await checkRecentSubmissions({ lookbackMinutes: 60 * 24 * 7 });
    //     await new Promise((r) => setTimeout(r, 300));
    // };

    // pull-to-refresh
    const refresh = async () => {
        setLoading(true);
        loadStudentData().then((err) => {
            if (err) {
                setError(err.cause);
            }
            setLoading(false);
        });
        await new Promise((r) => setTimeout(r, 300));
    };

    // const setTokens = async () => {
    //     try {
    //         const tokenString = localStorage.getItem("token");
    //         const userToken = JSON.parse(tokenString);
    //         const tokenValue = userToken.token;
    //         const res = await fetch("/api/profile", {
    //             method: "GET",
    //             headers: {
    //                 "Content-Type": "application/json",
    //                 "jwt-token": tokenValue,
    //             },
    //         });
    //         if (res.status == 500)
    //             throw new Error("[PROFILE] Error", {
    //                 cause: "Could not Connect.",
    //             });
    //         const data = await res.json();
    //         if (!res.ok)
    //             throw new Error("[PROFILE] Error", { cause: data.error });
    //         console.log(data);
    //         setStudentData((prevStudent) => ({
    //             ...prevStudent,
    //             username: data.username,
    //             university: data.university,
    //             major: data.major,
    //             xp: data.xp,
    //             filled: true,
    //         }));
    //     } catch (err) {
    //         console.log(err);
    //         setError(err.cause);
    //     }
    // };

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
                            open={showLevelUpPopup}
                            title="Congrats, you leveled up!"
                            message={`You earned ${levelUpGemsAwarded} gems for reaching Level ${justLeveledTo}.`}
                            buttonLabel1="Leave"
                            buttonLabel2="Stay"
                            onButton1={"handleLeave"}
                            onButton2={"handleStay"}
                            type={"levelUp"}
                            onClose={() => setShowLevelUpPopup(false)}
                        >
                            {/* optional extra content here */}
                        </MainPopup>

                        {/* Invalid Token Popup*/}
                        <MainPopup
                            open={canvasError}
                            title="Invalid Canvas Token"
                            message="Please Update your Access Token."
                            buttonLabel1="Close"
                        >
                            <SettingsEditWindow state={5} onClose={() => {}} />
                        </MainPopup>

                        {/* Quest Popup */}
                        <MainPopup
                            open={false}
                            title="Quests"
                            message="Claim a quest to earn gems"
                            buttonLabel1="Leave"
                            buttonLabel2="Stay"
                            onButton1={"handleLeave"}
                            onButton2={"handleStay"}
                            type={"quest"}
                        >
                            <button> Refresh Quest 50 gems</button>
                            <InfoTile>
                                Quest 1: Complete 3 assignments this week - 100
                                gems
                            </InfoTile>
                            <InfoTile>
                                Quest 2: Study for 5 hours this week - 75 gems
                            </InfoTile>
                            <InfoTile>
                                Quest 3: Participate in 2 battles this week -
                                150 gems
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

                        {coursesLoading && (
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

                        {!coursesLoading && error && (
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
                                            //onClick={loadCourses}
                                            onClick={refresh}
                                        >
                                            Try again
                                        </Button>
                                    </div>
                                </div>
                            </InfoTile>
                        )}

                        {!coursesLoading &&
                            !error &&
                            (!courses || courses.length === 0) && (
                                <InfoTile>
                                    <div className="text-muted">
                                        No active courses found.
                                    </div>
                                </InfoTile>
                            )}

                        {!coursesLoading &&
                            !error &&
                            visibleCourses.map((c, i) => (
                                <InfoTile key={c.id ?? i}>
                                    <CourseCard {...c} />
                                </InfoTile>
                            ))}

                        {!coursesLoading &&
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
