import React, { useEffect, useRef, useState } from "react";
import {Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import InfoTile from "../../newComponents/InfoTile/InfoTile.js";
import CourseCard from "../../components/CourseCard/CourseCard.js";
import AlertCard from "../../components/AlertCard/AlertCard.js";

import { Bell, ChevronDown, ChevronUp } from "react-bootstrap-icons";
import BaseScreen from "../BaseScreen/BaseScreen.js";

import {useAuth} from "../../api/AuthContext.js";

const COURSES_PREVIEW_COUNT = 3;
const ALERTS_PREVIEW_COUNT = 3;

function NewHomeScreen() {
    const navigate = useNavigate();

    const {studentData, loadStudentData, coursesLoading, alertsLoading} = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showAllCourses, setShowAllCourses] = useState(false);
    const [showAllAlerts, setShowAllAlerts] = useState(false);

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

        // pull-to-refresh
    const refresh = async () => {
        setLoading(true);
        loadStudentData().then(
            (err) => {
                if (err) {
                    setError(err.cause);
                }
                setLoading(false);
            }
        );
        await new Promise((r) => setTimeout(r, 300));
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
            <BaseScreen>
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
            </BaseScreen>
        </>
    );
}

export default NewHomeScreen;
