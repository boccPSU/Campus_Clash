import { useState, useEffect } from "react";
import Spinner from 'react-bootstrap/Spinner';
import { Button } from "react-bootstrap";
import InfoBox from "../InfoBox/InfoBox";
import { useNavigate } from "react-router-dom";

// Reusable component representing a single tournament card
function TournamentCard({ title, topics, endDate, reward }) {
    const navigate = useNavigate();

    // Loading state
    const [loading, setLoading] = useState(false);

    // Handle join button click
    const handleJoin = () => {
        setLoading(true);
        // Call API to create tournament
        fetch("http://localhost:5000/api/create-tournament", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title,
                topics,
                difficulty: "Medium",          
                reward,
                questionSet: null    
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to create tournament");
                }
                return response.json();
            })
            .then(data => {
                console.log("Tournament created:", data);
            })
            .catch(error => {
                console.error("Error creating tournament:", error);
            })
            .finally(() => {
                setLoading(false);
            });
        
        
        // Navigate to questions screen
        navigate("/questions");
    };

    // If loading data, show spinner
    if (loading) {
        return (
            <InfoBox>
                <Spinner animation="border" role="status" className="spinner">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>

                {/* Join button, send user to questionsScreen */}
                <div>
                    <Button variant="primary" className="joinBtn">
                        Join
                    </Button>
                </div>
            </InfoBox>
        );
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
                <Button
                    variant="primary"
                    className="joinBtn"
                    onClick={handleJoin}
                >
                    Join
                </Button>
            </div>
        </InfoBox>
    );
}

export default TournamentCard;
