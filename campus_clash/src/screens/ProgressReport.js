// Progress report screen that displays statistics for the students acedemic week
import { useState, useEffect, useRef } from "react";
import { CardTitle, Container } from "react-bootstrap";
import HeaderBar from "../components/HeaderBar/HeaderBar.js";
import BottomNav from "../components/BottomNav/BottomNav.js";
import InfoBox from "../components/InfoBox/InfoBox.js";
import ProgressSummaryCard from "../components/ProgressSummaryCard/ProgressSummaryCard.js";

import useCollapseOnScroll from "../components/hooks/useCollapseOnScroll";
import PullToRefresh from "../components/interaction/PullToRefresh";
import ScreenScroll from "../components/ScreenScroll/ScreenScroll";

function ProgressReport() {
    // Important Use State Vars
    const [xp, setXp] = useState(0);

    //Fetch xp from databse, temp value for now
    useEffect(() => {
        setXp(10500);
    }, []);

    // Collapsing header + PTR wiring
    const scrollerRef = useRef(null);
    const collapsed = useCollapseOnScroll(scrollerRef);
    const refresh = async () => {
        // TODO: refresh progress data
        await new Promise(r => setTimeout(r, 700));
    };

    return (
        <>
            {/*Header Section*/}
            <HeaderBar title="Progress Report" xp={xp} collapsed={collapsed}></HeaderBar>
            <div className={`headerSpacer ${collapsed ? "is-collapsed" : ""}`} />

            {/*Container to give screen body padding */}
            <ScreenScroll ref={scrollerRef}>
                <PullToRefresh scrollerRef={scrollerRef} onRefresh={refresh}>
                    <Container className="py-3 mb-5">
                        <InfoBox title={"Summary"}>
                            <ProgressSummaryCard></ProgressSummaryCard>
                        </InfoBox>
                    </Container>
                </PullToRefresh>

                <div style={{ height: "var(--bottom-nav-height, 72px)" }} />
            </ScreenScroll>

            {/*Footer Section*/}
            <BottomNav></BottomNav>
        </>
    );
}

export default ProgressReport;
