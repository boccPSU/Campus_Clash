import React from "react";
import { Card } from "react-bootstrap";
import { ArrowRight } from "react-bootstrap-icons";

function EventCard({ title, subtitle, date, location, xp }) {
    return (
        <Card className="eventCard">
            <Card.Body>
                <Card.Title className="eventCardTitle">{title}</Card.Title>
                <Card.Text className="eventCardSubtitle">{subtitle}</Card.Text>
                <Card.Text className="eventCardDate">{date}</Card.Text>
                <Card.Text className="eventCardLocation">{location}</Card.Text>
                <div className="eventCardXp">
                    <span className="small">+ {xp} XP</span>
                    <ArrowRight />
                </div>
            </Card.Body>
        </Card>
    );
}

export default EventCard;
