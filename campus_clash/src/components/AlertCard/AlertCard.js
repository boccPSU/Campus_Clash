// Shows alerts, can be deleted by clicking red trash icon
import React from "react";
import { Card, ProgressBar } from "react-bootstrap";

function AlertCard({ alertTitle, alertInfo}) {

  return (
    //creates a card for each course
    <Card className="alertCard">
      <Card.Body className="alertBody">
        <Card.Title className="alertTitle" >{alertTitle}</Card.Title>
        <Card.Body>{alertInfo}</Card.Body>
      </Card.Body>
    </Card>
  );
}

export default AlertCard;
