import { useState, useEffect } from "react";
import Spinner from 'react-bootstrap/Spinner';
import { Card } from "react-bootstrap";
import { ArrowRight } from "react-bootstrap-icons";
import InfoBox from "../InfoBox/InfoBox";


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
                <Spinner animation="border" role="status" className="spinner" aria-label="Loading Event" />
            </Card.Body>
        </Card>
        )
        
    }

    return (
        <Card className="eventCard">
            <Card.Body tabIndex={0}>
                <Card.Title className="eventCardTitle">{title}</Card.Title>
                <Card.Text className="eventCardSubtitle">{subtitle}</Card.Text>
                <Card.Text className="eventCardDate">{date}</Card.Text>
                <Card.Text className="eventCardLocation">{location}</Card.Text>
                <div className="eventCardXp">
                    <span className="small">+ {xp} XP</span>
                    <ArrowRight tabIndex={0} aria-label="Enter Event" role="button" />
                </div>
            </Card.Body>
        </Card>    
    );
}

export default EventCard;
