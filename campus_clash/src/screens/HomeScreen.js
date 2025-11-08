import React from "react";
import { Container, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import CourseCard from "../components/CourseCard";
import BottomNav from "../components/BottomNav";
import InfoBox from "../components/InfoBox";
import AlertCard from "../components/AlertCard";
import HeaderBar from "../components/HeaderBar";
import NavButton from "../components/NavButton";
import GpaDisplay from "../components/GpaDisplay";

function HomeScreen() {
    const navigate = useNavigate(); //Used for regular buttons to navigate to other screens

  // placeholder course data for display test purposes
  const courses = [
    { name: "CMPSC 421", percent: 86, grade: "B" },
    { name: "CMPSC 475", percent: 95, grade: "A" },
    { name: "CMPSC 212", percent: 79, grade: "C" },
    { name: "CMPSC 474", percent: 65, grade: "D" },
    { name: "STAT 318", percent: 50, grade: "F" },
  ];

  const currentXP = 10500;

  return (
    <>
        {/*Header Section */}
        <HeaderBar title="Home" xp={currentXP} />

        {/*Screen Body*/}
        <Container className="py-3">

            {/*Gpa Section*/}
            <GpaDisplay></GpaDisplay>
            
            {/*Courses*/}
            <InfoBox title="Courses">
                {courses.map((c, i) => (
                <CourseCard key={i} {...c} />
                ))}
            </InfoBox>
            
            {/*Progress Report and Study Plan Btns*/}
            <div className="d-flex justify-content-between mt-3">
                <Button className="button" onClick={() => navigate("/progressReport")}>Progress Report</Button>
                <Button className="button" onClick={() => navigate("/studyPlan")}>Study Plan</Button>
            </div>

            {/*Alert Section*/}
            <InfoBox title="Alerts">
                <AlertCard
                    alertTitle="Upcoming Exam in PHYS 212 Worth 15% of Your Grade"
                    alertInfo="Need > 78% grade to maintain a C"
                />
            </InfoBox>
        </Container>
    
        <BottomNav />
    </>
  );
}

export default HomeScreen;
