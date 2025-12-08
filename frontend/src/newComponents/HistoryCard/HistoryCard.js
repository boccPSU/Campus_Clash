// shows information about a course and will be reusable for the home page
import { useState, useId } from "react";
import Spinner from "react-bootstrap/Spinner";
import {Trophy} from "react-bootstrap-icons";

function HistoryCard({ opponent_username, victory, reward }) {
    // Loading state
    const [loading, setLoading] = useState(false);

    // If loading data, show spinner
    if (loading) {
        return (
            <div
                className="historyCard"
                tabIndex={0}
                aria-label="Loading History"
                aria-busy="true"
            >
                <div className="historyTitle d-flex justify-content-center">
                    <Spinner
                        animation="border"
                        role="status"
                        className="spinner"
                        aria-label="Loading"
                    />
                </div>
            </div>
        );
    }

    // Loaded state
    return (
        // creates a "card" for each course
        <div className="historyCard" tabIndex={0}>
            <Trophy/>
            <h1 className="history-text">{opponent_username}</h1>
            <h1 className="history-text">{victory}</h1>
            <h1 className="history-text">{reward} Gems</h1>
        </div>
    );
}

export default HistoryCard;
