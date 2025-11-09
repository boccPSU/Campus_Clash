// src/screens/LeaderboardScreen.js
import React, { useRef, useState } from "react";
import { Container } from "react-bootstrap";

import HeaderBar from "../components/HeaderBar/HeaderBar";
import BottomNav from "../components/BottomNav/BottomNav";
import TopMajorsCard from "../components/TopMajorsCard/TopMajorsCard";
import MajorGraphCard from "../components/MajorGraph/MajorGraphCard";
import LeaderboardTable from "../components/LeaderboardTable/LeaderboardTable";

import useCollapseOnScroll from "../components/hooks/useCollapseOnScroll";
import PullToRefresh from "../components/interaction/PullToRefresh";
import ScreenScroll from "../components/ScreenScroll/ScreenScroll"; // small scrollable wrapper
import { useEffect } from "react";
import InfoBox from "../components/InfoBox/InfoBox";

function LeaderboardScreen() {
    // Loading states
    const [loadingLeaderboard, setLoadingLeaderboard] = useState();

    const [error, setError] = useState();

    // Example leaderboard data
    const [data, setData] = useState();

    const scrollerRef = useRef(null);

    // Collapse header when user scrolls
    const collapsed = useCollapseOnScroll(scrollerRef);

    // Request leaderboard data
    useEffect(() => {
        (async () => {
            setLoadingLeaderboard(true); // Tell app we are loading
            try {
                // Call endpoint, and convert to json
                const res = await fetch("http://localhost:5000/api/major-xp");
                if (res.status === 500) throw new Error("[LEADERBOARD] Error", {cause: "Unable to Connect."});
                const data = await res.json();
                if (!res.ok) throw new Error("Failed to fetch Majors-XP", {cause: data.cause});
                const row = data.row;
                console.log("ROW", row);

                // Map data to leaderboard cards.
                const mappedData = row.map((row, idx) => ({
                    rank: idx + 1,
                    major: row.major ?? "Unknown",
                    xp: row.totalXp ?? row.xp ?? 0,
                }));

                setData(mappedData);
                return;
            } catch (e) {
                console.log(e);
                setError(e.cause);
            } finally {
                setLoadingLeaderboard(false); // Stop loading
            }
        })();
    }, []);

    // Fake refresh for PTR demo
    const refresh = async () => {
        await new Promise((r) => setTimeout(r, 900));
        setData((prev) =>
            prev.map((row) =>
                row.rank === 1 ? { ...row, xp: row.xp + 100 } : row
            )
        );
    };

    return (
        <>
            {/* Fixed header with collapsing state */}
            <HeaderBar title="Leaderboard" xp={10500} collapsed={collapsed} />

            {/* Spacer pushes content below fixed header */}
            <div
                className={`headerSpacer ${collapsed ? "is-collapsed" : ""}`}
            />
            {error && (
                <div className="text-danger">{error}</div>
            )}
            {/* Internal scrollable container for screen content */}
            <ScreenScroll ref={scrollerRef}>
                {/* Wrap content in PullToRefresh (optional) */}
                <PullToRefresh scrollerRef={scrollerRef} onRefresh={refresh}>
                    <Container className="py-3 mb-5">
                        <TopMajorsCard
                            topMajors={(data ?? []).slice(0, 3).map((r, i) => ({
                                rank: i + 1,
                                major: r.major,
                                xp: r.xp ?? 0,
                            }))}
                        />
                        <InfoBox title={"Major Graph"}>
                            <MajorGraphCard data={data ?? []} />
                        </InfoBox>

                        <LeaderboardTable data={data} />
                    </Container>
                </PullToRefresh>

                {/* Spacer so fixed BottomNav doesn’t overlap content */}
                <div style={{ height: "var(--bottom-nav-height, 72px)" }} />
            </ScreenScroll>

            {/* Bottom navigation bar */}
            <BottomNav />
        </>
    );
}

export default LeaderboardScreen;
