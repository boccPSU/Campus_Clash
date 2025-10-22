//shows information about a course and will be reusable for the home page
import { useState, useEffect, useId } from "react";
import Spinner from 'react-bootstrap/Spinner';
import { Card, ProgressBar } from "react-bootstrap";

function CourseCard({ name, grade, percent }) {
    const titleId = useId();
    const metaId = useId();

	//Loading state
	const [loading, setLoading] = useState(true);
    //sets the color based on current grade
    const variant = percent >= 85 ? "success" : percent >= 70 ? "warning" : "danger";

	// On page loading
	useEffect(()=>{
		//Simulating latency 1000ms to see spinner
		const timer = setTimeout(()=>{
			setLoading(false);
		}, 1000)
	}, [])
	
	// If loading data, show spinner
    if(loading){
        return(
			<Card className="courseCard" tabIndex={0} aria-label="Loading Course" aria-busy="true">
                <Card.Body className="courseTitle">
                    <Spinner animation="border" role="status" className="spinner" aria-label="Loading" />
                </Card.Body>
            </Card>     
        )
    }

    // Loaded state
    return (
        //creates a card for each course
        <Card className="courseCard" aria-labelledby={titleId} tabIndex={0}>
            <Card.Body className="courseTitle" as="h3">
                <Card.Title id={titleId} className="mb-1" style={{ fontSize: "1rem" }}>
                    {name}
                </Card.Title>
                <ProgressBar
                    now={percent}
                    variant={variant}
                    label={`${percent}% ${grade}`}
                />
            </Card.Body>
        </Card>
    );
}

export default CourseCard;
