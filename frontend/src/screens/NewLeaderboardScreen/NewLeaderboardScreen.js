// src/screens/LeaderboardScreen.js
import React, { useRef, useState, useEffect } from "react";

import ScreenScroll from "../../components/ScreenScroll/ScreenScroll";
import PullToRefresh from "../../components/interaction/PullToRefresh";
import useCollapseOnScroll from "../../components/hooks/useCollapseOnScroll";

import InfoTile from "../../newComponents/InfoTile/InfoTile";
import TopMajorsCard from "../../components/TopMajorsCard/TopMajorsCard";
import MajorGraphCard from "../../components/MajorGraph/MajorGraphCard";
import LeaderboardTable from "../../components/LeaderboardTable/LeaderboardTable";

import XpHeaderBar from "../../newComponents/XpHeaderBar/XpHeaderBar";
import BottomNavBar from "../../newComponents/BottomNavBar/BottomNavBar";

import Container from "react-bootstrap/Container";
import InfoBox from "../../components/InfoBox/InfoBox";
import BottomNav from "../../newComponents/BottomNavBar/BottomNavBar";
import Spinner from "react-bootstrap/Spinner";

function NewLeaderboardScreen() {
    // Which leaderboard we’re showing: "majors" or "students"
    const [mode, setMode] = useState("majors");

    // Major leaderboard state
    const [majorData, setMajorData] = useState([]);
    const [loadingMajors, setLoadingMajors] = useState(false);
    const [majorError, setMajorError] = useState("");

    // Student leaderboard state
    const [studentData, setStudentData] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [studentError, setStudentError] = useState("");
    const [search, setSearch] = useState("");

    // Current user rank info on student leaderboard
    const [userRankInfo, setUserRankInfo] = useState(null);
    const [userRankLoading, setUserRankLoading] = useState(false);

    const scrollerRef = useRef(null);
    const collapsed = useCollapseOnScroll(scrollerRef);

    // Fetch major on mount
    useEffect(() => {
        (async () => {
            console.log("[LEADERBOARD] Fetching major XP data...");
            setLoadingMajors(true);
            setMajorError("");

            try {
                const res = await fetch("http://localhost:5000/api/major-xp");

                if (!res.ok) {
                    const errBody = await res.json().catch(() => ({}));
                    throw new Error("Failed to fetch Majors-XP", {
                        cause: errBody.cause,
                    });
                }

                const body = await res.json();
                const rows = Array.isArray(body) ? body : body.rows;

                if (!Array.isArray(rows)) {
                    throw new Error("Majors-XP response is not an array");
                }

                const mappedData = rows.map((row, idx) => ({
                    rank: idx + 1,
                    major: row.major ?? "Unknown",
                    xp: row.totalXp ?? row.xp ?? 0,
                }));

                setMajorData(mappedData);
                console.log("[LEADERBOARD] Fetched major XP data:", mappedData);
                console.log("[LEADERBOARD] Major data length:", mappedData.length);
            } catch (e) {
                console.error(e);
                setMajorError(e.cause || e.message || "Unknown error");
            } finally {
                console.log("[LEADERBOARD] Finished fetching major XP data.");
                setLoadingMajors(false);
            }
        })();
    }, []);

    // Fetch student leaderboard when mode switches to "students"
    useEffect(() => {
        if (mode !== "students") return;
        if (studentData.length > 0) return; // already loaded once

        (async () => {
            setLoadingStudents(true);
            setStudentError("");
            setUserRankInfo(null);

            try {
                // TODO: adjust endpoint name to match your backend
                const res = await fetch(
                    "http://localhost:5000/api/leaderboard/students"
                );

                if (!res.ok) {
                    const errBody = await res.json().catch(() => ({}));
                    throw new Error("Failed to fetch student leaderboard", {
                        cause: errBody.cause,
                    });
                }

                const body = await res.json();
                const rows = Array.isArray(body) ? body : body.rows;

                if (!Array.isArray(rows)) {
                    throw new Error("Student leaderboard response is not an array");
                }

                const mapped = rows.map((row, idx) => ({
                    rank: idx + 1,
                    username: row.username ?? "Unknown",
                    xp: row.totalXp ?? row.xp ?? 0,
                }));

                setStudentData(mapped);
                console.log("[LEADERBOARD] Fetched student leaderboard:", mapped);

                // Once we have student data, compute current user rank
                await updateCurrentUserRank(mapped);
            } catch (e) {
                console.error(e);
                setStudentError(e.cause || e.message || "Unknown error");
            } finally {
                setLoadingStudents(false);
            }
        })();
      
    }, [mode]);

    // Get current user + compute their rank on the given leaderboard
    const updateCurrentUserRank = async (students) => {
        try {
            setUserRankLoading(true);

            // Get token from localStorage
            const tokenString = localStorage.getItem("token");
            if (!tokenString) {
                setUserRankInfo(null);
                return;
            }

            let tokenValue = "";
            try {
                const parsed = JSON.parse(tokenString);
                tokenValue = parsed.token || tokenString;
            } catch {
                tokenValue = tokenString;
            }

            const resUser = await fetch(
                "http://localhost:5000/api/current-user",
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "jwt-token": tokenValue,
                    },
                }
            );

            if (!resUser.ok) {
                console.warn("[LEADERBOARD] Unable to fetch current user for rank.");
                setUserRankInfo(null);
                return;
            }

            const { username } = await resUser.json();
            if (!username) {
                setUserRankInfo(null);
                return;
            }

            const idx = students.findIndex(
                (row) => row.username === username
            );

            if (idx === -1) {
                setUserRankInfo({
                    username,
                    rank: null,
                    xp: null,
                });
            } else {
                setUserRankInfo({
                    username,
                    rank: idx + 1,
                    xp: students[idx].xp,
                });
            }
        } catch (e) {
            console.error("[LEADERBOARD] Failed to compute user rank:", e);
            setUserRankInfo(null);
        } finally {
            setUserRankLoading(false);
        }
    };

   
    const refresh = async () => {
        await new Promise((r) => setTimeout(r, 900));
        setMajorData((prev) =>
            prev.map((row) =>
                row.rank === 1 ? { ...row, xp: row.xp + 100 } : row
            )
        );
    };

    // Filtered student list for search
    const filteredStudents =
        search.trim().length === 0
            ? studentData
            : studentData.filter((row) =>
                  row.username
                      .toLowerCase()
                      .includes(search.trim().toLowerCase())
              );

    return (
        <>
            <ScreenScroll ref={scrollerRef}>
                <PullToRefresh scrollerRef={scrollerRef} onRefresh={refresh}>
                    <Container className="mainContainer">
                        {/* XP Header */}
                        <XpHeaderBar />

                        {/* Leaderboard and season title */}
                        <h1 className="leaderboardTitle"> Leaderboard Season 1 </h1>
                        {/* Toggle between Major vs Student leaderboard */}
                        <div className="leaderboardToggle">
                            <button
                                type="button"
                                className={
                                    mode === "majors"
                                        ? "toggleBtn active"
                                        : "toggleBtn"
                                }
                                onClick={() => setMode("majors")}
                            >
                                Majors
                            </button>
                            <button
                                type="button"
                                className={
                                    mode === "students"
                                        ? "toggleBtn active"
                                        : "toggleBtn"
                                }
                                onClick={() => setMode("students")}
                            >
                                Students
                            </button>
                        </div>

                        {/* Error messages */}
                        {mode === "majors" && majorError && (
                            <div className="text-danger mb-2">
                                {majorError}
                            </div>
                        )}
                        {mode === "students" && studentError && (
                            <div className="text-danger mb-2">
                                {studentError}
                            </div>
                        )}

                        {/* MAJOR LEADERBOARD */}
                        {mode === "majors" && (
                            <>
                                {loadingMajors && majorData.length === 0 ? (
                                    <div className="leaderboardLoading">
                                        <Spinner
                                            animation="border"
                                            size="sm"
                                            className="me-2"
                                        />
                                        <span>Loading major leaderboard…</span>
                                    </div>
                                ) : (
                                    <div className="leaderboardList">
                        
                                        <LeaderboardTable data={majorData} />
                                    </div>
                                )}
                            </>
                        )}

                        {/* STUDENT LEADERBOARD */}
                        {mode === "students" && (
                            <div className="leaderboardList">
                                {/* Rank summary */}
                                <div className="userRankSummary">
                                    {userRankLoading ? (
                                        <span>Calculating your rank…</span>
                                    ) : !userRankInfo ? (
                                        <span>
                                            Sign in and play to see your rank.
                                        </span>
                                    ) : userRankInfo.rank == null ? (
                                        <span>
                                            {userRankInfo.username},{" "}
                                            you’re not on the leaderboard yet.
                                        </span>
                                    ) : (
                                        <span>
                                            {userRankInfo.username}, you’re{" "}
                                            <strong>
                                                #{userRankInfo.rank}
                                            </strong>{" "}
                                            with{" "}
                                            <strong>
                                                {userRankInfo.xp} XP
                                            </strong>
                                            .
                                        </span>
                                    )}
                                </div>

                                {/* Search bar */}
                                <div className="leaderboardSearch">
                                    <input
                                        type="text"
                                        className="leaderboardSearchInput"
                                        placeholder="Search student by username…"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                    />
                                </div>

                                {loadingStudents && studentData.length === 0 ? (
                                    <div className="leaderboardLoading">
                                        <Spinner
                                            animation="border"
                                            size="sm"
                                            className="me-2"
                                        />
                                        <span>Loading student leaderboard…</span>
                                    </div>
                                ) : filteredStudents.length === 0 ? (
                                    <p>No students found.</p>
                                ) : (
                                    <div className="studentLeaderboard">
                                        {filteredStudents.map((row) => (
                                            <div
                                                key={row.username}
                                                className="studentRow"
                                            >
                                                <span className="studentRank">
                                                    #{row.rank}
                                                </span>
                                                <span className="studentName">
                                                    {row.username}
                                                </span>
                                                <span className="studentXp">
                                                    {row.xp} XP
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </Container>
                </PullToRefresh>

                {/* Spacer so fixed BottomNav doesn’t overlap content */}
                <div style={{ height: "var(--bottom-nav-height, 72px)" }} />
            </ScreenScroll>

            {/* Bottom navigation bar */}
            <BottomNav />
        </>
    );
}

export default NewLeaderboardScreen;
