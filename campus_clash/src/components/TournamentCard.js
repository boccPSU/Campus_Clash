import React from "react";
import { Card, Button } from "react-bootstrap";
import "../index.scss";

function TournamentCard({ title, topics, endDate, reward }) {
  return (
    <Card className="shadow-sm rounded-4 p-3 mb-4 border border-primary bg-dark text-light text-center">
      <h5 className="fw-bold mb-2 text-light">{title}</h5>
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
    </Card>
  );
}

export default TournamentCard;
