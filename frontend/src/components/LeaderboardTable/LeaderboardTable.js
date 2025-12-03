import { useState, useEffect } from "react";
import Spinner from "react-bootstrap/Spinner";
import InfoBox from "../InfoBox/InfoBox";
import InfoTile from "../../newComponents/InfoTile/InfoTile";

import {useAuth} from "../../api/AuthContext";

// Component displaying a leaderboard of majors ranked by XP
function LeaderboardTable({ data = [] }) {
    const [loading, setLoading] = useState(true);
    const [studentMajor, setStudentMajor] = useState(null);

    const {token} = useAuth();


    // Fetch current student's major
    useEffect(() => {
        (async () => {
            try {
                const tokenString = localStorage.getItem("token");
                if (!tokenString) {
                    console.log(
                        "[LeaderboardTable] No token, cannot fetch student major."
                    );
                    setStudentMajor(null);
                    return;
                }

                // let tokenValue = "";
                // try {
                //     const parsed = JSON.parse(tokenString);
                //     tokenValue = parsed.token || tokenString;
                // } catch {
                //     tokenValue = tokenString;
                // }

                const res = await fetch(
                    "http://localhost:5000/api/student-major",
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            "jwt-token": token,
                        },
                    }
                );

                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    console.warn(
                        "[LeaderboardTable] Failed to fetch student major:",
                        body
                    );
                    setStudentMajor(null);
                    return;
                }

                const body = await res.json();
                const major = body.major ?? null;
                setStudentMajor(major);
                console.log(
                    "[LeaderboardTable] Current student's major:",
                    major
                );
            } catch (e) {
                console.error(
                    "[LeaderboardTable] Error fetching student major:",
                    e
                );
                setStudentMajor(null);
            }
        })();
    }, []);

    // Filter + rank majors
    const leaderboardData = data
        .filter(
            (item) =>
                (item.major ?? "").toLowerCase() !== "unknown" &&
                Number(item.xp) > 0
        )
        .map((item, idx) => ({ ...item, rank: idx + 1 }));

    const normalizedStudentMajor =
        studentMajor && typeof studentMajor === "string"
            ? studentMajor.trim().toLowerCase()
            : null;

    if (loading) {
        return (
            <InfoTile>
                <div className="row normalMajor">
                    <Spinner
                        animation="border"
                        role="status"
                        className="spinner"
                    >
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            </InfoTile>
        );
    }

    return (
        <InfoTile>
            {leaderboardData.map((item, i) => {
                const normalizedRowMajor =
                    (item.major ?? "").trim().toLowerCase();

                const isStudentMajor =
                    normalizedStudentMajor &&
                    normalizedRowMajor === normalizedStudentMajor;

                // If we know the student's major and this row matches it highlight.
                // If we don't know the major, fall back to highlighting rank 1.
                const rowClass =
                    isStudentMajor ||
                    (!normalizedStudentMajor && i === 0)
                        ? "topMajor"
                        : "normalMajor";

                return (
                    <div key={i} className={`row ${rowClass}`}>
                        {/* Major name and rank */}
                        <div className="left">
                            <span className="rankMajor">
                                {`${item.rank}: ${item.major}`}
                            </span>
                        </div>

                        {/* XP points, formatted with commas */}
                        <div className="right">
                            <span className="xp">
                                {item.xp.toLocaleString()} XP
                            </span>
                        </div>
                    </div>
                );
            })}
        </InfoTile>
    );
}

export default LeaderboardTable;
