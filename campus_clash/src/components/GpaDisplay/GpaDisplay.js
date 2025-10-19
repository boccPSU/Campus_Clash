//Displays students GPA and Major
import Spinner from 'react-bootstrap/Spinner';
import { useState, useEffect } from "react";
import { Card } from "react-bootstrap";

function GpaDisplay() {
    const [gpa, setGpa] = useState(0.0);
    const [major, setMajor] = useState("");
    // Loading state
    const [loading, setLoading] = useState(true);

    // On page loading
    useEffect(()=>{
        //Fetch GPA and Major via api later, temp value for now
        setGpa(3.7);
        setMajor("Computer Science");

        //Simulating latency 1000ms to see spinner
        const timer = setTimeout(()=>{
            setLoading(false);
        }, 1000)
        return () => clearTimeout(timer);
    }, [])
    
    // If loading data, show spinner
    if(loading){
        return(
            <Card className="gpaDisplayCard">
                <Spinner animation="border" role="status" className="spinner">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Card>
        )
        
    }

    return (
        <Card className="gpaDisplayCard">
            <h3 className="">
                GPA <span className="">{gpa}</span>
            </h3>
            <div className="">Major: {major}</div>
        </Card>
    );
}

export default GpaDisplay;
