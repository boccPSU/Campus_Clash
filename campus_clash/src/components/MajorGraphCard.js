import React from "react";
import "../index.scss";
import InfoBox from "./InfoBox";

function MajorGraphCard() {
  return (
    <InfoBox title={"Major Graph"}>
      <h5 className="fw-bold mb-3 text-light">Major Graph</h5>
      <div
        className="rounded-3 d-flex flex-column justify-content-center align-items-center border border-primary bg-dark"
        style={{ height: "220px" }}
      >
        <p className="text-light mb-1">XP Graph Placeholder</p>
        <small className="text-secondary">Data visualization coming soon</small>
      </div>
      <button className="btn btn-primary mt-3 px-4 py-1 rounded-pill fw-semibold">
        Enlarge Graph
      </button>
    </InfoBox>
  );
}

export default MajorGraphCard;
