import React, {useEffect, useRef, useState } from "react";
import { Container} from "react-bootstrap";

import BottomNavBar from "../../newComponents/BottomNavBar/BottomNavBar.js";
import InfoTile from "../../newComponents/InfoTile/InfoTile.js";
import PullToRefresh from "../../components/interaction/PullToRefresh.js";
import ScreenScroll from "../../components/ScreenScroll/ScreenScroll.js";
import SettingsEditWindow from "../../newComponents/ProfileSettings/SettingsEditWindow.js";

import XpHeaderBar from "../../newComponents/XpHeaderBar/XpHeaderBar.js";
import MainPopup from "../../newComponents/MainPopup/MainPopup.js";

import {useAuth} from "../../api/AuthContext.js";

function BaseScreen({children}) {
    
    const {loadStudentData, canvasError} = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const scrollerRef = useRef(null);

            // pull-to-refresh
    const refresh = async () => {
        setLoading(true);
        loadStudentData().then(
            (err) => {
                if (err) {
                    setError(err.cause);
                }
                setLoading(false);
            }
        );
        await new Promise((r) => setTimeout(r, 300));
    };

    return (
        <>
            <ScreenScroll ref={scrollerRef}>
                <PullToRefresh scrollerRef={scrollerRef} onRefresh={refresh}>
                    <Container className="mainContainer" id="mainContainer">
                        {/* Level Up Popup (should be on each screen) */}
                        <MainPopup
                            open={false}
                            title="Congrats, you leveled up!"
                            message="Next level unlocked at 1500 XP."
                            buttonLabel1="Leave"
                            buttonLabel2="Stay"
                            onButton1={"handleLeave"}
                            onButton2={"handleStay"}
                            type={"levelUp"}
                        >
                            {/* optional extra content here */}
                        </MainPopup>

                        {/* Invalid Token Popup*/} 
                        <MainPopup
                            open={canvasError}
                            title="Invalid Canvas Token"
                            message="Please Update your Access Token."
                            buttonLabel1="Close"
                        >
                            <SettingsEditWindow state={5} onClose={() => {}}/>
                        </MainPopup>

                        {/* Quest Popup */}
                        <MainPopup
                            open={false}
                            title="Quests"
                            message="Claim a quest to earn gems"
                            buttonLabel1="Leave"
                            buttonLabel2="Stay"
                            onButton1={"handleLeave"}
                            onButton2={"handleStay"}
                            type={"quest"}
                        >
                            <button> Refresh Quest 50 gems</button>
                            <InfoTile>
                                Quest 1: Complete 3 assignments this week - 100 gems
                            </InfoTile>
                            <InfoTile>
                                Quest 2: Study for 5 hours this week - 75 gems
                            </InfoTile>
                            <InfoTile>
                                Quest 3: Participate in 2 battles this week - 150 gems
                            </InfoTile>
                        </MainPopup>

                        <XpHeaderBar
                            level={4}
                            currentXp={1200}
                            xpForNextLevel={1500}
                        ></XpHeaderBar>
                        {children}
                    </Container>
                </PullToRefresh>
                
                <div style={{ height: "var(--bottom-nav-height, 72px)" }} />
            </ScreenScroll>

            <BottomNavBar />
        </>
    );
}

export default BaseScreen;
