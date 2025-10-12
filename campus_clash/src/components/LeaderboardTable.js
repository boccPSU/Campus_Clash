import React from "react";
import "../index.scss";
import InfoBox from "./InfoBox";

function LeaderboardTable({ data = [] }) {
  const leaderboardData =
    data.length > 0
      ? data
      : [
          { rank: 1, major: "Computer Science", xp: 48000 },
          { rank: 2, major: "Mechanical Engineering", xp: 46000 },
          { rank: 3, major: "Electrical Engineering", xp: 45000 },
        ];

  return (
    <InfoBox title={"Major Leaderboard"}>
      {/* Added visual section header */}
      <h4 className="fw-bold text-center mb-4 text-light">Major Leaderboard</h4>

      {leaderboardData.map((item, i) => (
        <div
          key={i}
          className={`d-flex justify-content-between align-items-center py-2 px-3 mb-2 rounded-3 ${
            i === 0 ? "bg-primary text-white" : "bg-dark border border-secondary"
          }`}
        >
          <span className="fw-bold">{`${item.rank}: ${item.major}`}</span>
          <span className="fw-semibold">{item.xp.toLocaleString()} XP</span>
        </div>
      ))}
    </InfoBox>
  );
}

export default LeaderboardTable;
