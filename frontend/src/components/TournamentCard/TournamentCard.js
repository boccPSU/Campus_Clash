import { useState, useEffect } from "react";
import Spinner from "react-bootstrap/Spinner";
import { Button } from "react-bootstrap";
import InfoBox from "../InfoBox/InfoBox";
import { useNavigate } from "react-router-dom";
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';

// Reusable component representing a single tournament card
function TournamentCard({ title, topics, endDate, reward }) {
    const navigate = useNavigate();

    // States
    const [difficulty, setDifficulty] = useState("Easy");
    const [xp, setXp] = useState(200); // Easy 200xp, medium 300x, hard 400xp
    // Loading state
    const [loading, setLoading] = useState(false);

    // Handle join button click
    const handleJoin = async () => {
        setLoading(true);
    
        try {
            // Check if tournament exists
            const res = await fetch(
                `http://localhost:5000/api/tournament/title-exists/${encodeURIComponent(
                    title
                )}`
            );
            const tournamentExists = await res.json();

            console.log(tournamentExists)
    
            // For now you always create — but at least await it
            if (!tournamentExists) {
                let res = await fetch("http://localhost:5000/api/create-tournament", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        title,
                        topics,
                        difficulty,
                        reward,
                    }),
                });
                console.log("Tournament Created - ", res.json());
                // Create question set (get actual JSON, not the Response)
                // let questionsData;
                // try {
                //     const qRes = await fetch(
                //         "http://localhost:5000/api/generate-questions",
                //         {
                //             method: "POST",
                //             headers: { "Content-Type": "application/json" },
                //             body: JSON.stringify({
                //                 category: topics,
                //                 difficulty: difficulty,
                //                 count: 5,
                //             }),
                //         }
                //     );
        
                //     const qJson = await qRes.json();
                //     // assuming backend returns { questions: [...] }
                //     questionsData = qJson.questions;
                // } catch (e) {
                //     console.log("Failed to generate questions Error: " + e);
                // }
        
                // console.log("Logging questions:", questionsData);
        
                // // Store questions in table
                // try {
                //     await fetch(
                //         `http://localhost:5000/api/tournament/add-questions/${encodeURIComponent(
                //             title
                //         )}`,
                //         {
                //             method: "POST",
                //             headers: { "Content-Type": "application/json" },
                //             body: JSON.stringify({ questions: questionsData }),
                //         }
                //     );
                // } catch (e) {
                //     console.log(
                //         "Failed to store questions in tournament table Error: " + e
                //     );
                // }
            }
    
            // Go to questions screen
            navigate("/questions", {
                state: {
                    title,
                },
            });
        } catch (e) {
            console.log("Failed to create tournament: Error " + e);
        } finally {
            setLoading(false);
        }
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

                    <DropdownButton id="dropdown-basic-button" title="Difficulty">
                        <Dropdown.Item onClick={() => { setDifficulty("Easy"); setXp(200); }}> Easy </Dropdown.Item>
                        <Dropdown.Item onClick={() => { setDifficulty("Medium"); setXp(300); }}>Medium</Dropdown.Item>
                        <Dropdown.Item onClick={() => { setDifficulty("Hard"); setXp(400); }}> Hard </Dropdown.Item>
                    </DropdownButton>
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
                <span className="tLabel">Difficulty</span> {difficulty}
            </div>

            {/* XP reward amount */}
            <div className="tReward">
                <span className="tLabel">XP Reward:</span> {xp} XP
            </div>

            {/* Join button + Difficulty Dropdown */}
            <div className="btnGroup">
                <Button
                    variant="primary"
                    className="joinBtn"
                    onClick={handleJoin}
                >
                    Join
                </Button>
                <DropdownButton id="difficultyBtn" title="Difficulty">
                        <Dropdown.Item onClick={() => { setDifficulty("Easy"); setXp(200) }}> Easy </Dropdown.Item>
                        <Dropdown.Item onClick={() => { setDifficulty("Medium"); setXp(300) }}>Medium</Dropdown.Item>
                        <Dropdown.Item onClick={() => { setDifficulty("Hard"); setXp(400) }}> Hard </Dropdown.Item>
                </DropdownButton>
            </div>
        </InfoBox>
    );
}

export default TournamentCard;
