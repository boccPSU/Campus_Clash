import React from "react";
import "../index.scss";
import InfoBox from "./InfoBox";

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
      <div className="d-flex justify-content-center align-items-end" style={{ height: "160px" }}>
        
        {/* 2nd Place */}
        <div className="mx-2 d-flex flex-column align-items-center">
          <div className="fw-semibold small mb-1 text-light text-center" style={{ maxWidth: "90px" }}>
            {second?.major}
          </div>
          <div
            className="d-flex justify-content-center align-items-end bg-primary text-white rounded-top"
            style={{ height: "90px", width: "70px" }}
          >
            <span className="fw-bold">🥈</span>
          </div>
        </div>

        {/* 1st Place */}
        <div className="mx-2 d-flex flex-column align-items-center">
          <div className="fw-semibold small mb-1 text-light text-center" style={{ maxWidth: "90px" }}>
            {first?.major}
          </div>
          <div
            className="d-flex justify-content-center align-items-end bg-primary text-white rounded-top"
            style={{ height: "120px", width: "70px" }}
          >
            <span className="fw-bold">🥇</span>
          </div>
        </div>

        {/* 3rd Place */}
        <div className="mx-2 d-flex flex-column align-items-center">
          <div className="fw-semibold small mb-1 text-light text-center" style={{ maxWidth: "90px" }}>
            {third?.major}
          </div>
          <div
            className="d-flex justify-content-center align-items-end bg-primary text-white rounded-top"
            style={{ height: "75px", width: "70px" }}
          >
            <span className="fw-bold">🥉</span>
          </div>
        </div>
      </div>
    </InfoBox>
  );
}

export default TopMajorsCard;
