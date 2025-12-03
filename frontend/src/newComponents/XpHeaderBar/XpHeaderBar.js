import React, { useEffect, useState } from "react";
import ProgressBar from "react-bootstrap/ProgressBar";

import {useAuth} from "../../api/AuthContext";

// Leveling constraints
const BASE_XP_PER_LEVEL = 200;
const XP_INCREMENT_PER_LEVEL = 100;

// Helper function to compute level info based on total xp
function computeLevelInfo(totalXp) {
    let level = 1; // starting level
    let xpRemaining = totalXp;
    let costForNextLevel = BASE_XP_PER_LEVEL;

    // While we have enough XP to level up, spend it and move up a level
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

function XpHeaderBar() {
    const {studentData, loadStudentData} = useAuth();
    // Important states
    const [level, setLevel] = useState(1);
    const [currentXp, setCurrentXp] = useState(0);
    const [xpForNextLevel, setXpForNextLevel] = useState(BASE_XP_PER_LEVEL);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchXp() {
            try {
                setLoading(true);
                setError("");

                // // Get token from localStorage
                // const tokenString = localStorage.getItem("token");
                // if (!tokenString) {
                //     setError("Not logged in");
                //     setLoading(false);
                //     return;
                // }

                // let parsed;
                // try {
                //     parsed = JSON.parse(tokenString);
                // } catch (err) {
                //     console.error("Failed to parse token from localStorage:", err);
                //     setError("Invalid auth token");
                //     setLoading(false);
                //     return;
                // }

                // const token = parsed?.token;
                // if (!token) {
                //     setError("Missing auth token");
                //     setLoading(false);
                //     return;
                // }

                // // Get current user from backend
                // const userRes = await fetch(
                //     "http://localhost:5000/api/current-user",
                //     {
                //         method: "GET",
                //         headers: {
                //             "Content-Type": "application/json",
                //             "jwt-token": token,
                //         },
                //     }
                // );

                // if (!userRes.ok) {
                //     console.error(
                //         "Failed to get current user:",
                //         userRes.status,
                //         userRes.statusText
                //     );
                //     setError("Unable to load user");
                //     setLoading(false);
                //     return;
                // }


                // const userData = await userRes.json();
                // const username = userData.username;

                console.log(studentData);
                
                const username = studentData?.username;
                if (!username) {
                    setError("No username returned from server");
                    setLoading(false);
                    return;
                }

                // Get XP for this username
                const xpRes = await fetch("http://localhost:5000/api/users/xp", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ username }),
                });

                if (!xpRes.ok) {
                    console.error(
                        "Failed to fetch XP:",
                        xpRes.status,
                        xpRes.statusText
                    );
                    setError("Unable to load XP");
                    setLoading(false);
                    return;
                }

                const xpData = await xpRes.json();
                const totalXpRaw = xpData.xp ?? 0;
                const totalXp = Number.isFinite(totalXpRaw) ? totalXpRaw : 0;

                // Compute level info
                const info = computeLevelInfo(totalXp);

                setLevel(info.level);
                setCurrentXp(info.currentXp);
                setXpForNextLevel(info.xpForNextLevel);
                setLoading(false);
            } catch (e) {
                console.error("Error loading XP:", e);
                setError("Error loading XP");
                setLoading(false);
            }
        }

        fetchXp();
    }, []);

    const progressPercent = Math.max(
        0,
        Math.min(100, (currentXp / xpForNextLevel) * 100)
    );

    return (
        <div className="xpHeaderBar">
            <div className="xpHeaderBarTop">
                <span className="xpHeaderBarLevel">
                    {loading ? "Level ..." : `Level ${level}`}
                </span>
                <span className="xpHeaderBarGems">Gems: 123</span>
            </div>

            <ProgressBar
                now={loading ? 0 : progressPercent}
                className="xpHeaderBarProgressBar"
                aria-label="Experience progress"
            />

            <div className="xpHeaderBarBottom">
                {error ? (
                    <span className="xpHeaderBarXpError">{error}</span>
                ) : (
                    <span className="xpHeaderBarXp">
                        {loading
                            ? "Loading XP..."
                            : `${currentXp} / ${xpForNextLevel} XP`}
                    </span>
                )}
            </div>
        </div>
    );
}

export default XpHeaderBar;
