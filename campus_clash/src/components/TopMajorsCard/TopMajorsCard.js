import React from "react";
//import "../index.scss";
import InfoBox from "../InfoBox/InfoBox";

// Component that visually displays the top 3 majors
function TopMajorsCard({ topMajors = [] }) {
    // Destructure top 3 majors, with fallback values
    const [first, second, third] = topMajors.length
        ? topMajors
        : [
              { rank: 1, major: "Computer Science" },
              { rank: 2, major: "Mechanical Engineering" },
              { rank: 3, major: "Electrical Engineering" },
          ];

    return (
        <InfoBox title={"Top 3 Majors"}>
            {/* Bar-style visualization of top 3 majors */}
            <div className="topMajorsWrap">
                {/* 2nd Place */}
                <div className="tmCol">
                    <div className="tmTitle">{second?.major}</div>
                    <div className="tmBarBase tmBarSecond">
                        <span className="tmMedal">🥈</span>
                    </div>
                </div>

                {/* 1st Place */}
                <div className="tmCol">
                    <div className="tmTitle">{first?.major}</div>
                    <div className="tmBarBase tmBarFirst">
                        <span className="tmMedal">🥇</span>
                    </div>
                </div>

                {/* 3rd Place */}
                <div className="tmCol">
                    <div className="tmTitle">{third?.major}</div>
                    <div className="tmBarBase tmBarThird">
                        <span className="tmMedal">🥉</span>
                    </div>
                </div>
            </div>
        </InfoBox>
    );
}

export default TopMajorsCard;
