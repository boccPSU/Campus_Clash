import React, { useRef } from "react";
import { Container } from "react-bootstrap";
import BottomNav from "../components/BottomNav/BottomNav.js";
import TournamentCard from "../components/TournamentCard/TournamentCard.js";
import HeaderBar from "../components/HeaderBar/HeaderBar.js";
//import "../index.scss.js";

import useCollapseOnScroll from "../components/hooks/useCollapseOnScroll";
import PullToRefresh from "../components/interaction/PullToRefresh";
import ScreenScroll from "../components/ScreenScroll/ScreenScroll";

// Screen displaying available tournaments
function TournamentScreen() {
    // Static tournament list data
    const tournaments = [
        {
            title: "Science Showdown",
            topics: "Chemistry, Biology, Physics",
            endDate: "Sept. 25, 12:00 a.m.",
            reward: 250,
        },
        {
            title: "History Battle",
            topics: "World War I, World War II",
            endDate: "Sept. 30, 12:00 a.m.",
            reward: 300,
        },
        {
            title: "Business Blitz",
            topics: "Economics, Marketing, Finance",
            endDate: "Oct. 5, 12:00 a.m.",
            reward: 275,
        },
    ];

    // User XP for header display
    const currentXP = 10500;

    // Collapsing header + PTR wiring
    const scrollerRef = useRef(null);
    const collapsed = useCollapseOnScroll(scrollerRef);
    const refresh = async () => {
        // TODO: refresh tournaments list
        await new Promise(r => setTimeout(r, 700));
    };

    return (
        <>
            {/* Top navigation header */}
            <HeaderBar title="Tournaments" xp={currentXP} collapsed={collapsed} />
            <div className={`headerSpacer ${collapsed ? "is-collapsed" : ""}`} />

            <ScreenScroll ref={scrollerRef}>
                <PullToRefresh scrollerRef={scrollerRef} onRefresh={refresh}>
                    <Container className="py-3 mb-5 text-center">
                        {/* Section heading */}
                        <h5 className="fw-bold mb-4 text-dark">
                            Available Tournaments
                        </h5>

                        {/* Map through and render all tournament cards */}
                        {tournaments.map((t, i) => (
                            <TournamentCard
                                key={i}
                                title={t.title}
                                topics={t.topics}
                                endDate={t.endDate}
                                reward={t.reward}
                            />
                        ))}
                    </Container>
                </PullToRefresh>

                {/* Persistent bottom navigation space */}
                <div style={{ height: "var(--bottom-nav-height, 72px)" }} />
            </ScreenScroll>

            {/* Persistent bottom navigation */}
            <BottomNav />
        </>
    );
}

export default TournamentScreen;
