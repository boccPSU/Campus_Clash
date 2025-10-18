// Displays all study plans students can take to increase grades in clases that they are struggling in
import { useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import HeaderBar from "../components/HeaderBar/HeaderBar.js";
import BottomNav from "../components/BottomNav/BottomNav.js";
import InfoBox from "../components/InfoBox/InfoBox.js";
import StudyPlanTitle from "../components/StudyPlanTitle/StudyPlanTitle.js";
import StudyTaskCard from "../components/StudyTaskCard/StudyTaskCard.js";
function StudyPlan() {
    // Important Use State Vars
    const [xp, setXp] = useState(0);

    //Temp info for study plans
    const studyPlans = [
        {
            title: "STAT 318",
            gpaImpact: "High",
            tasks: [
                {
                    header: "Prepare For Exam 2",
                    description:
                        "Exam 2 is worth 15% of your grade. Getting above a 80% can bring your F to a D",
                },
                {
                    header: "Turn in HW 03",
                    description:
                        "Failing to turn in HW 01 will cause your grade to drop by 3% to a 47% F",
                },
                {
                    header: "Turn in HW 02",
                    description:
                        "Getting a 100% on HW 02 will increase your grade by 3%",
                },
            ],
        },
        {
            title: "CMPSC 474",
            gpaImpact: "High",
            tasks: [
                {
                    header: "Turn in Assignmnet 2",
                    description:
                        "Getting 100% on assignment 2 will increase your grade by 10% to a 73% D",
                },
            ],
        },
        {
            title: "CMPSC 475",
            gpaImpact: "Low",
            tasks: [
                {
                    header: "Turn in Assignmnet 3",
                    description:
                        "Missing Assignmnet 3 will drop your grade by 10% to a 85% B",
                },
            ],
        },
    ];

    //Fetch xp from databse, temp value for now
    useEffect(() => {
        setXp(10500);
    }, []);
    return (
        <>
            {/*Header Section*/}
            <HeaderBar title="Study Plan" xp={xp}></HeaderBar>

            {/*Container to give screen body padding */}
            <Container className="py-3 mb-5">
                {/*Map through each study plan component*/}
                {studyPlans.map((e, k) => (
                    <InfoBox>
                        <StudyPlanTitle title={e.title}></StudyPlanTitle>
                        {/*Map Through Each Study Task */}
                        {e.tasks.map((task, j) => (
                            <StudyTaskCard
                                title={task.header}
                                description={task.description}
                            ></StudyTaskCard>
                        ))}
                    </InfoBox>
                ))}
            </Container>

            {/*Footer Section*/}
            <BottomNav></BottomNav>
        </>
    );
}

export default StudyPlan;
