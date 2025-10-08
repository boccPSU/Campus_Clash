// creates the home screen using staic numbers and visuals for now until data is integrated

import React from "react";
import { Container, Card, Button } from "react-bootstrap";
import CourseCard from "../components/CourseCard";
import BottomNav from "../components/BottomNav";

function HomeScreen() {

    //placeholder course data for dispaly test purposes
  const courses = [
    { name: "CMPSC 421", percent: 86, grade: "B" },
    { name: "CMPSC 475", percent: 95, grade: "A" },
    { name: "CMPSC 212", percent: 79, grade: "C" },
    { name: "CMPSC 474", percent: 65, grade: "D" },
    { name: "STAT 318", percent: 50, grade: "F" },
  ];

  return (
    <>
    {/* creates the header */}
      <div className="bg-primary text-white text-center py-2">
        <h5 className="m-0">Term: Spring 25/26</h5>
        <div className="small">XP: 10,500 points</div>
      </div>

{/* Container centers content and gives left/right padding */}
      <Container className="py-3">
        {/* Card gives a white box with shadow and padding */}
        <Card className="p-3 mb-3 shadow-sm">
          <h3 className="mb-1">GPA <span className="float-end">3.7</span></h3>
          <div className="text-muted">Major: Computer Science</div>
        </Card>
        
        {/* Map each course to a CourseCard component */}
        <h5>Courses</h5>
        {courses.map((c, i) => (
          <CourseCard key={i} {...c} />
        ))}

        {/* adds the addition buttons for progress report and study plan */}
        <div className="d-flex justify-content-between mt-3">
          <Button variant="outline-primary">Progress Report</Button>
          <Button variant="primary">Study Plan</Button>
        </div>

        {/* adds the alert box */}
        <Card className="p-2 mt-4">
          <h6>Alerts</h6>
          <p className="mb-0 small">Upcoming Exam in PHYS 212 worth 15% of your grade</p>
        </Card>
      </Container>

      <BottomNav />
    </>
  );
}

export default HomeScreen;
