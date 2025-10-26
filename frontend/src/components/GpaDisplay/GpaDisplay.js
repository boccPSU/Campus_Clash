import Spinner from 'react-bootstrap/Spinner';
import { Card } from "react-bootstrap";

function GpaDisplay({ gpa, major = "Computer Science", loading }) {
    // While loading, show spinner
    if (loading) {
        return (
            <Card className="gpaDisplayCard">
                <Spinner animation="border" role="status" className="spinner">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Card>
        );
    }

    return (
        <Card className="gpaDisplayCard">
            <h3>
                Semester GPA <span>{gpa !== null && gpa !== undefined ? gpa : "—"}</span>
            </h3>
            <div>Major: {major}</div>
        </Card>
    );
}

export default GpaDisplay;
