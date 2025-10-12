import React from "react";
import { Button } from "react-bootstrap";
import "../index.scss";
import InfoBox from "./InfoBox";

// Reusable component representing a single tournament card
function TournamentCard({ title, topics, endDate, reward }) {
  return (
    // Wrapper component providing consistent layout and styling
    <InfoBox title={title}>
      {/* Tournament topics */}
      <div className="small mb-1">
        <span className="fw-semibold">Topics:</span> {topics}
      </div>

      {/* Tournament end date */}
      <div className="small mb-1">
        <span className="fw-semibold">Tournament Ends:</span> {endDate}
      </div>

      {/* XP reward amount */}
      <div className="small mb-3">
        <span className="fw-semibold">XP Reward:</span> {reward} XP
      </div>

      {/* Join button */}
      <div>
        <Button
          variant="primary"
          className="px-4 rounded-pill fw-semibold"
        >
          Join
        </Button>
      </div>
    </InfoBox>
  );
}

export default TournamentCard;
