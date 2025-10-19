import { useState, useEffect } from "react";
import Spinner from 'react-bootstrap/Spinner';
import InfoBox from "../InfoBox/InfoBox";

// Card component for displaying a placeholder or preview of a major-related XP graph
function MajorGraphCard() {
    // Loading state
    const [loading, setLoading] = useState(true);

    // On page loading
    useEffect(()=>{
        //Simulating latency 1000ms to see spinner
        const timer = setTimeout(()=>{
            setLoading(false);
        }, 1000)
        return () => clearTimeout(timer);
    }, [])

    // If loading data, show spinner
    if(loading){
        return(
            // Wrapper providing consistent styling and layout
			<InfoBox title={"Major Graph"}>
				{/* Placeholder graph box — future area for data visualization */}
				<div className="graphBox" style={{ height: "220px" }}>
					<Spinner animation="border" role="status" className="spinner">
                    	<span className="visually-hidden">Loading...</span>
                	</Spinner>
				</div>

				{/* Action button to open a larger version of the graph */}
				<button className="enlargeBtn">Enlarge Graph</button>
			</InfoBox>
        )
        
    }

    return (
        // Wrapper providing consistent styling and layout
        <InfoBox title={"Major Graph"}>
            {/* Placeholder graph box — future area for data visualization */}
            <div className="graphBox" style={{ height: "220px" }}>
                {/* Placeholder text while graph is under development */}
                <p className="graphText">XP Graph Placeholder</p>
                <small className="graphSub">
                    Data visualization coming soon
                </small>
            </div>

            {/* Action button to open a larger version of the graph */}
            <button className="enlargeBtn">Enlarge Graph</button>
        </InfoBox>
    );
}

export default MajorGraphCard;
