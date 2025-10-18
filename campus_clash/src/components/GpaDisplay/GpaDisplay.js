//Displays students GPA and Major

import { useState, useEffect } from "react";
import { Card } from "react-bootstrap";

function GpaDisplay() {
    const [gpa, setGpa] = useState(0.0);
    const [major, setMajor] = useState("");
    //Fetch GPA and Major via api later, temp value for now
    useEffect(() => {
        setGpa(3.7);
        setMajor("Computer Science");
    }, []);

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
