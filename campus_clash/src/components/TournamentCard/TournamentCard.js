import { useState, useEffect } from "react";
import Spinner from 'react-bootstrap/Spinner';
import { Button } from "react-bootstrap";
import InfoBox from "../InfoBox/InfoBox";

// Reusable component representing a single tournament card
function TournamentCard({ title, topics, endDate, reward }) {
    // Loading state
    const [loading, setLoading] = useState(true);

    // On page loading
    useEffect(()=>{
        //Simulating latency 1000ms to see spinner
        const timer = setTimeout(()=>{
            setLoading(false);
        }, 1000)
        return () => clearTimeout(timer);
    }, [])
    
    // If loading data, show spinner
    if(loading){
        return(
            <InfoBox>
               
                <Spinner animation="border" role="status" className="spinner">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>

                {/* Join button */}
                <div>
                    <Button variant="primary" className="joinBtn">
                        Join
                    </Button>
                </div>
            </InfoBox>
        )
        
    }

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
                <Button variant="primary" className="joinBtn">
                    Join
                </Button>
            </div>
        </InfoBox>
    );
}

export default TournamentCard;
