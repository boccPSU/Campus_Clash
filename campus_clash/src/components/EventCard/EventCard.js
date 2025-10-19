import { useState, useEffect } from "react";
import Spinner from 'react-bootstrap/Spinner';
import { Card } from "react-bootstrap";
import { ArrowRight } from "react-bootstrap-icons";

function EventCard({ title, subtitle, date, location, xp }) {
    // Loading state
    const [loading, setLoading] = useState(true);

    // On page loading
    useEffect(() => {
        //Simulating latency 1000ms to see spinner
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    // If loading data, show spinner
    if(loading){
        return(
            <Card className="eventCard">
            <Card.Body>
                <Spinner animation="border" role="status" className="spinner">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Card.Body>
        </Card>
        )
        
    }

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
