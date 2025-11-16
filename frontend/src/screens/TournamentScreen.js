import React, { useRef } from "react";
import { Container } from "react-bootstrap";
import BottomNav from "../components/BottomNav/BottomNav.js";
import TournamentCard from "../components/TournamentCard/TournamentCard.js";
import HeaderBar from "../components/HeaderBar/HeaderBar.js";
//import "../index.scss.js";

import useCollapseOnScroll from "../components/hooks/useCollapseOnScroll.js";
import PullToRefresh from "../components/interaction/PullToRefresh.js";
import ScreenScroll from "../components/ScreenScroll/ScreenScroll.js";

// Screen displaying available tournaments
function TournamentScreen() {
    // Generate tournaments based on students major and enrolled courses later
    
    // Static tournament list data
    const tournaments = [
        {
            title: "Computer Science Challenge",
            topics: "Computer Science, Algorithms",
            endDate: "Sept. 25, 12:00 a.m.",
            reward: 250,
        },
        {
            title: "Mechanical Engineering Challenge",
            topics: "Mechanical Engineering",
            endDate: "Sept. 25, 12:00 a.m",
            reward: 250,
        }
    ];

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
            <HeaderBar title="Tournaments" collapsed={collapsed} />
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
