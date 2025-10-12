import React from "react";
import { Card, Button } from "react-bootstrap";
import "../index.scss";
import InfoBox from "./InfoBox";

function TournamentCard({ title, topics, endDate, reward }) {
  return (
    <InfoBox title={title}>
      <div className="small mb-1">
        <span className="fw-semibold">Topics:</span> {topics}
      </div>
      <div className="small mb-1">
        <span className="fw-semibold">Tournament Ends:</span> {endDate}
      </div>
      <div className="small mb-3">
        <span className="fw-semibold">XP Reward:</span> {reward} XP
      </div>
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
