import React from "react";
import { Card } from "react-bootstrap";
import { ArrowRight } from "react-bootstrap-icons";

function EventCard({ title, subtitle, date, location, xp }) {
  return (
    <Card className="mb-3 shadow-sm bg-dark text-white">
      <Card.Body>
        <Card.Title>{title}</Card.Title>
        <Card.Text className="mb-1 small">{subtitle}</Card.Text>
        <Card.Text className="small mb-1">{date}</Card.Text>
        <Card.Text className="small mb-2">{location}</Card.Text>
        <div className="d-flex justify-content-between align-items-center">
          <span className="small">+ {xp} XP</span>
          <ArrowRight />
        </div>
      </Card.Body>
    </Card>
  );
}

export default EventCard;
