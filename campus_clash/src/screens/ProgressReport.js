// Progress report screen that displays statistics for the students acedemic week
import { useState, useEffect} from "react";
import { CardTitle, Container } from "react-bootstrap";
import HeaderBar from "../components/HeaderBar";
import BottomNav from "../components/BottomNav";
import InfoBox from "../components/InfoBox";
import ProgressSummaryCard from "../components/ProgressSummaryCard";
function ProgressReport(){
    // Important Use State Vars
    const [xp, setXp] = useState(0);

    //Fetch xp from databse, temp value for now
    useEffect(() => {
        setXp(10500);
    }, []);

    return(
    <>
        {/*Header Section*/}
        <HeaderBar title = "Progress Report" xp = {xp}></HeaderBar>

        {/*Container to give screen body padding */}
        <Container className="py-3 mb-5">
            <InfoBox title={"Summary"}>
                
                <ProgressSummaryCard></ProgressSummaryCard>
            </InfoBox>
        </Container>
        
        {/*Footer Section*/}
        <BottomNav></BottomNav>
    </>
    )
}

export default ProgressReport;