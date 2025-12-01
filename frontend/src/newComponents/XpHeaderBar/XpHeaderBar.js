import React from "react";
import ProgressBar from "react-bootstrap/ProgressBar";

function XpHeaderBar({ level, currentXp, xpForNextLevel }) {
    const progressPercent = Math.max(
        0,
        Math.min(100, (currentXp / xpForNextLevel) * 100)
    );

    return (
        <div className="xpHeaderBar">
            <div className="xpHeaderBarTop">
                <span className="xpHeaderBarLevel">Level {level}</span>
                <span className="xpHeaderBarGems">Gems: 123</span>
            </div>

            <ProgressBar
                now={progressPercent}
                className="xpHeaderBarProgressBar"
                aria-label="Experience progress"
            />

            <div className="xpHeaderBarBottom">
                <span className="xpHeaderBarXp">
                    {currentXp} / {xpForNextLevel} XP
                </span>
            </div>
        </div>
    );
}

export default XpHeaderBar;
