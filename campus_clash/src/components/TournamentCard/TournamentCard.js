import React from "react";
import { Button } from "react-bootstrap";
//import "../index.scss";
import InfoBox from "../InfoBox/InfoBox";

// Reusable component representing a single tournament card
function TournamentCard({ title, topics, endDate, reward }) {
  return (
    // Wrapper component providing consistent layout and styling
    <InfoBox title={title}>
      {/* Tournament topics */}
      <div className="tMeta">
        <span className="tLabel">Topics:</span> {topics}
      </div>

      {/* Tournament end date */}
      <div className="tMeta">
        <span className="tLabel">Tournament Ends:</span> {endDate}
      </div>

      {/* XP reward amount */}
      <div className="tReward">
        <span className="tLabel">XP Reward:</span> {reward} XP
      </div>

      {/* Join button */}
      <div>
        <Button
          variant="primary"
          className="joinBtn"
        >
          Join
        </Button>
      </div>
    </InfoBox>
  );
}

export default TournamentCard;
