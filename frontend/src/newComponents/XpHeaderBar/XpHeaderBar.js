import React, { useEffect, useState } from "react";
import ProgressBar from "react-bootstrap/ProgressBar";
import { useAuth } from "../../api/AuthContext";

// Leveling constraints
const BASE_XP_PER_LEVEL = 200;
const XP_INCREMENT_PER_LEVEL = 100;

// Helper function to compute level info based on total xp
function computeLevelInfo(totalXp) {
    let level = 1; // starting level
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

function XpHeaderBar() {
    const {
        token,
        studentData,
        studentDataLoading,
        loadBasicStudentData,  
    } = useAuth();

    const [level, setLevel] = useState(1);
    const [currentXp, setCurrentXp] = useState(0);
    const [xpForNextLevel, setXpForNextLevel] = useState(BASE_XP_PER_LEVEL);
    const [error, setError] = useState("");

    // Make sure we at least have basic student data when header shows
    useEffect(() => {
        if (!token) {
            return;
        }

        // If nothing loaded yet and we’re not currently loading, trigger a basic load
        if (!studentData && !studentDataLoading) {
            console.log("[LOAD] [XpHeaderBar] No studentData, calling loadBasicStudentData()");
            loadBasicStudentData();
        }
    }, [token, studentData, studentDataLoading, loadBasicStudentData]);

    // Recompute level/xp whenever studentData changes
    useEffect(() => {
        //console.log("[XpHeaderBar] studentDataLoading:", studentDataLoading);
        //console.log("[XpHeaderBar] studentData:", studentData);

        // While context is still loading the profile, we just show "Loading..."
        if (studentDataLoading && !studentData) {
            return;
        }

        if (!studentData) {
            setError("Not logged in");
            return;
        }

        setError("");

        const totalXpRaw = studentData.xp;
        const totalXp =
            typeof totalXpRaw === "number" && Number.isFinite(totalXpRaw)
                ? totalXpRaw
                : 0;

        const info = computeLevelInfo(totalXp);
        setLevel(info.level);
        setCurrentXp(info.currentXp);
        setXpForNextLevel(info.xpForNextLevel);
        console.log("[XpHeaderBar] Level info:", info);
    }, [studentData, studentDataLoading]);

    const isLoading = studentDataLoading && !studentData;

    const progressPercent = Math.max(
        0,
        Math.min(100, (currentXp / xpForNextLevel) * 100)
    );

    const gemsRaw = studentData?.gems;
    const gems =
        typeof gemsRaw === "number" && Number.isFinite(gemsRaw)
            ? gemsRaw
            : 0;

    return (
        <div className="xpHeaderBar" id="xpHeader">
            <div className="xpHeaderBarTop">
                <span className="xpHeaderBarLevel">
                    {isLoading ? "Level ..." : `Level ${level}`}
                </span>
                <span className="xpHeaderBarGems">
                    {isLoading ? "Gems ..." : `Gems: ${gems}`}
                </span>
            </div>

            <ProgressBar
                now={isLoading ? 0 : progressPercent}
                className="xpHeaderBarProgressBar"
                aria-label="Experience progress"
            />

            <div className="xpHeaderBarBottom">
                {error ? (
                    <span className="xpHeaderBarXpError">{error}</span>
                ) : (
                    <span className="xpHeaderBarXp">
                        {isLoading
                            ? "Loading XP..."
                            : `${currentXp} / ${xpForNextLevel} XP`}
                    </span>
                )}
            </div>
        </div>
    );
}

export default XpHeaderBar;
