// Shows alerts, can be deleted by clicking red trash icon
import React from "react";
import { useState, useEffect } from "react";
import Spinner from "react-bootstrap/Spinner";
import { Card, ProgressBar } from "react-bootstrap";

function AlertCard({ alertTitle, alertInfo }) {
    //Alert card loading state
    const [loading, setLoading] = useState(true);

    // On page loading
    useEffect(() => {
        //Simulating latency 1000ms for loader
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);
    }, []);

    // If loading data, show spinner
    if (loading) {
        return (
            <Card className="alertCard">
                <Card.Body className="alertBody">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </Card.Body>
            </Card>
        );
    }

    return (
        //creates a card for each course
        <Card className="alertCard">
            <Card.Body className="alertBody">
                <Card.Title className="alertTitle">{alertTitle}</Card.Title>
                <Card.Body>{alertInfo}</Card.Body>
            </Card.Body>
        </Card>
    );
}

export default AlertCard;
