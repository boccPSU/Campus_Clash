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

function LeaderboardScreen() {
  const scrollerRef = useRef(null);

  // Collapse header when user scrolls
  const collapsed = useCollapseOnScroll(scrollerRef);

  // Example leaderboard data
  const [data, setData] = useState([
    { rank: 1, major: "Computer Science", xp: 48000 },
    { rank: 2, major: "Mechanical Engineering", xp: 46000 },
    { rank: 3, major: "Electrical Engineering", xp: 45000 },
    { rank: 4, major: "Business Administration", xp: 43000 },
    { rank: 5, major: "Biology", xp: 41000 },
    { rank: 6, major: "Psychology", xp: 40000 },
    { rank: 7, major: "Nursing", xp: 38000 },
    { rank: 8, major: "Chemistry", xp: 37000 },
    { rank: 9, major: "Finance", xp: 35000 },
    { rank: 10, major: "Political Science", xp: 34000 },
  ]);

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
      <div className={`headerSpacer ${collapsed ? "is-collapsed" : ""}`} />

      {/* Internal scrollable container for screen content */}
      <ScreenScroll ref={scrollerRef}>
        {/* Wrap content in PullToRefresh (optional) */}
        <PullToRefresh scrollerRef={scrollerRef} onRefresh={refresh}>
          <Container className="py-3 mb-5">
            <TopMajorsCard
              topMajors={[
                { rank: 1, major: "Computer Science" },
                { rank: 2, major: "Mechanical Engineering" },
                { rank: 3, major: "Electrical Engineering" },
              ]}
            />
            <MajorGraphCard />
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
