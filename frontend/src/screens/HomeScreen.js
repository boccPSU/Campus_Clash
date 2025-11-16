import React, { useEffect, useMemo, useRef, useState } from "react";
import { Container, Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import CourseCard from "../components/CourseCard/CourseCard.js";
import BottomNav from "../components/BottomNav/BottomNav.js";
import InfoBox from "../components/InfoBox/InfoBox.js";
import AlertCard from "../components/AlertCard/AlertCard.js";
import HeaderBar from "../components/HeaderBar/HeaderBar.js";
import GpaDisplay from "../components/GpaDisplay/GpaDisplay.js";

import useCollapseOnScroll from "../components/hooks/useCollapseOnScroll.js";
import PullToRefresh from "../components/interaction/PullToRefresh.js";
import ScreenScroll from "../components/ScreenScroll/ScreenScroll.js";

import { createCanvasProxyClient } from "../api/canvasApi";
import { computeGPAEqualCredits, percentToLetter } from "../utils/gpa";
import { logUpcomingAssignmentsForSelectedCourses } from "../api/canvas.js";
import { getUpcomingAssignmentAlerts } from "../api/canvas.js";

import { getMySemesterCoursesWithGrades } from "../api/canvas.js";
import { Award } from "react-bootstrap-icons";
import { checkRecentSubmissions } from "../api/canvas.js";

function HomeScreen() {
    const navigate = useNavigate();

    // UI state
    const [courses, setCourses] = useState([]); // [{ id, name, percent(int|undefined), grade(letter|'—') }]
    const [gpa, setGpa] = useState(null); // number | null
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [alerts, setAlerts] = useState([]);
    const [alertsLoading, setAlertsLoading] = useState(true);

    const [studentData, setStudentData] = useState(JSON.parse(sessionStorage.getItem('studentData')));

    useEffect(() => {
        sessionStorage.setItem('studentData', JSON.stringify(studentData));
    }, [studentData]);

    // collapse header / pull-to-refresh
    const scrollerRef = useRef(null);
    const collapsed = useCollapseOnScroll(scrollerRef);

    const loadCourses = async () => {
        setError("");
        setLoading(true);
        try {
            // 1) Fetch filtered + deduped courses for THIS semester that HAVE grades.
            //    Shape: [{ id, name, percent(number|null), grade(string|null), created_at }, ...]
            const raw = await getMySemesterCoursesWithGrades();

            // 2) Compute GPA from RAW values (use precise percent if present)
            const nextGpa = computeGPAEqualCredits(
                raw.map((c) => ({ grade: c.grade, percent: c.percent }))
            );
            setGpa(nextGpa);

            // 3) Normalize for display:
            //    - Round percent only for the bar label (keep undefined if missing)
            //    - Always show a letter: Canvas letter OR derived from percent; if neither → "—"
            const normalizedForUI = raw.map((c) => {
                const rawPercent =
                    typeof c.percent === "number" ? c.percent : null;
                const roundedPercent =
                    rawPercent !== null ? Math.round(rawPercent) : undefined;
                const letter = c.grade || percentToLetter(rawPercent) || "—";
                return {
                    id: c.id,
                    name: c.name ?? `Course ${c.id}`,
                    percent: roundedPercent, // integer for the bar
                    grade: letter,
                };
            });

            setCourses(normalizedForUI);
            setStudentData(prevStudent => ({
                ...prevStudent,
                gpa: nextGpa,
                courses: normalizedForUI,
                filled: true
            }));
            console.log("Student Data Post-Course Load: ", studentData);
        } catch (e) {
            console.error("Failed to load Canvas data:", e);
            setError(
                `Could not load courses from Canvas.\n${e?.message ?? ""}`
            );
            setCourses([]);
            setGpa(null);
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
            setStudentData(prevStudent => ({
                ...prevStudent,
                alerts: upcoming,
                filled: true
            }));
            console.log("Student Data Post-Alerts Load: ", studentData);
        } catch (e) {
            console.error("Failed to load upcoming assignments:", e);
            setAlerts([]);
        } finally {
            setAlertsLoading(false);
        }
    };

    // initial load
    useEffect(() => {
        (async () => {
            let studentDataToken = JSON.parse(sessionStorage.getItem('studentData'));
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

    // pull-to-refresh
    const refresh = async () => {
        await setTokens();
        await loadCourses();
        await loadAlerts();
        await checkRecentSubmissions({ lookbackMinutes: 60 * 24 * 7 });
        await new Promise((r) => setTimeout(r, 300));
    };

    const setTokens = async () => {
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
            console.log(data);
            setStudentData(prevStudent => ({
                ...prevStudent,
                username: data.username,
                university: data.university,
                major: data.major,
                xp: data.xp,
                filled: true
            }));
        } catch (err) {
            console.log(err);
            setError(err.cause);
        }
    };

    return (
        <>
            <HeaderBar
                title="Home"
                aria-label="Home"
                collapsed={collapsed}
            />
            <div
                className={`headerSpacer ${collapsed ? "is-collapsed" : ""}`}
            />

            <ScreenScroll ref={scrollerRef}>
                <PullToRefresh scrollerRef={scrollerRef} onRefresh={refresh}>
                    <Container className="py-3">
                        {/* GPA Section — pass computed GPA */}
                        <GpaDisplay gpa={studentData?.gpa ?? undefined} />

                        {/* Courses */}
                        <InfoBox title="Courses">
                            {loading && (
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
                            )}

                            {!loading && error && (
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
                            )}

                            {!loading && !error && courses.length === 0 && (
                                <div className="text-muted">
                                    No active courses found.
                                </div>
                            )}

                            {!loading &&
                                !error &&
                                studentData.courses.map((c, i) => (
                                    <CourseCard key={i} {...c} />
                                ))}
                        </InfoBox>

                        {/* Progress Report and Study Plan Btns */}
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

                        {/* Alert Section */}
                        <InfoBox title="Alerts">
                            {alertsLoading && (
                                <AlertCard
                                    alertTitle="Loading alerts…"
                                    alertInfo="Fetching upcoming items"
                                />
                            )}
                            {!alertsLoading && alerts.length === 0 && (
                                <div className="text-muted">
                                    No upcoming graded items in the next 14
                                    days.
                                </div>
                            )}
                            {!alertsLoading &&
                                studentData.alerts.map((a) => (
                                    <AlertCard
                                        key={a.id}
                                        alertTitle={`${a.type}: ${a.title}`}
                                        alertInfo={`${a.courseName} • Due ${a.dueLabel}`}
                                    />
                                ))}
                        </InfoBox>
                    </Container>
                </PullToRefresh>

                <div style={{ height: "var(--bottom-nav-height, 72px)" }} />
            </ScreenScroll>

            <BottomNav />
        </>
    );
}

export default HomeScreen;
