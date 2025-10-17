import React from "react";
import InfoBox from "../InfoBox/InfoBox";

// Card component for displaying a placeholder or preview of a major-related XP graph
function MajorGraphCard() {
  return (
    // Wrapper providing consistent styling and layout
    <InfoBox title={"Major Graph"}>
      {/* Section header text */}
      <h5 className="fw-bold mb-3 text-light">Major Graph</h5>

      {/* Placeholder graph box — future area for data visualization */}
      <div
        className="rounded-3 d-flex flex-column justify-content-center align-items-center border border-primary bg-dark"
        style={{ height: "220px" }}
      >
        {/* Placeholder text while graph is under development */}
        <p className="text-light mb-1">XP Graph Placeholder</p>
        <small className="text-secondary">Data visualization coming soon</small>
      </div>

      {/* Action button to open a larger version of the graph */}
      <button className="btn btn-primary mt-3 px-4 py-1 rounded-pill fw-semibold">
        Enlarge Graph
      </button>
    </InfoBox>
  );
}

export default MajorGraphCard;
