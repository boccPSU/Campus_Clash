//shows information about a course and will be reusable for the home page
import React from "react";
import { Card, ProgressBar } from "react-bootstrap";

function CourseCard({ name, grade, percent }) {
    //sets the color based on current grade
  const variant =
    percent >= 85 ? "success" :
    percent >= 70 ? "warning" : "danger";

  return (
    //creates a card for each course
    <Card className="courseCard">
      <Card.Body className="courseTitle">
        <Card.Title className="mb-1" style={{ fontSize: "1rem" }}>{name}</Card.Title>
        <ProgressBar now={percent} variant={variant} label={`${percent}% ${grade}`} />
      </Card.Body>
    </Card>
  );
}

export default CourseCard;
