import React from "react";
import InfoBox from "../InfoBox/InfoBox";

// Card component for displaying a placeholder or preview of a major-related XP graph
function MajorGraphCard() {
  return (
    // Wrapper providing consistent styling and layout
    <InfoBox title={"Major Graph"}>
      {/* Placeholder graph box — future area for data visualization */}
      <div
        className="graphBox"
        style={{ height: "220px" }}
      >
        {/* Placeholder text while graph is under development */}
        <p className="graphText">XP Graph Placeholder</p>
        <small className="graphSub">Data visualization coming soon</small>
      </div>

      {/* Action button to open a larger version of the graph */}
      <button className="enlargeBtn">
        Enlarge Graph
      </button>
    </InfoBox>
  );
}

export default MajorGraphCard;
