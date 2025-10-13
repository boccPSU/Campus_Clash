// Shows alerts, can be deleted by clicking red trash icon
import React from "react";
import { Card, ProgressBar } from "react-bootstrap";

function AlertCard({ alertTitle, alertInfo}) {

  return (
    //creates a card for each course
    <Card className="mb-2 shadow-sm">
      <Card.Body className="p-2">
        <Card.Title className="mb-1 fs-5" >{alertTitle}</Card.Title>
        <Card.Body>{alertInfo}</Card.Body>
      </Card.Body>
    </Card>
  );
}

export default AlertCard;
