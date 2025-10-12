//Displays students GPA and Major

import { useState, useEffect} from "react";
import {Card} from "react-bootstrap";

function GpaDisplay(GPA){
    const [gpa, setGpa] = useState(0.0);
    const [major, setMajor] = useState("");
    //Fetch GPA and Major via api later, temp value for now
    useEffect(() => {
        setGpa(3.7);
        setMajor("Computer Science");
    }, []);

    return(
        <Card className="p-3 mb-3 shadow-sm">
          <h3 className="mb-1">GPA <span className="float-end">{gpa}</span></h3>
          <div className="text-muted">Major: {major}</div>
        </Card>
    )
}

export default GpaDisplay;