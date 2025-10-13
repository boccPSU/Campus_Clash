// Displays most important sumamry reports for each acedemic week

import { Card } from "react-bootstrap";

function ProgressSummaryCard(){
    return(
        <Card className ="progressSummaryCard">
            <p className = "description">Description</p>
            <p className = "value">Value</p>
        </Card>
    )
    
}

export default ProgressSummaryCard;