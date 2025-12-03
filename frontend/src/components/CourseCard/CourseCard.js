// shows information about a course and will be reusable for the home page
import { useState, useId } from "react";
import Spinner from "react-bootstrap/Spinner";
import { ProgressBar } from "react-bootstrap";

function CourseCard({ name, grade, percent }) {
    const titleId = useId();

    // Loading state
    const [loading, setLoading] = useState(false);

    // sets the color based on current grade
    const variant =
        percent >= 85 ? "success" : percent >= 70 ? "warning" : "danger";

    // If loading data, show spinner
    if (loading) {
        return (
            <div
                className="courseCard"
                tabIndex={0}
                aria-label="Loading course"
                aria-busy="true"
            >
                <div className="courseTitle d-flex justify-content-center">
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
        <div className="courseCard" aria-labelledby={titleId} tabIndex={0}>
            <h3 id={titleId} className="courseTitle">
                {name}
            </h3>
            <ProgressBar
                now={percent}
                variant={variant}
                label={`${percent}% ${grade}`}
                className="progressBar"
            />
        </div>
    );
}

export default CourseCard;
