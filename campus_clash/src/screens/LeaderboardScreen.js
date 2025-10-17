import React from "react";
import { Container } from "react-bootstrap";
import BottomNav from "../components/BottomNav/BottomNav.js";
import TopMajorsCard from "../components/TopMajorsCard/TopMajorsCard.js";
import MajorGraphCard from "../components/MajorGraph/MajorGraphCard.js";
import LeaderboardTable from "../components/LeaderboardTable/LeaderboardTable.js";
import HeaderBar from "../components/HeaderBar/HeaderBar.js";

// Main screen component for displaying leaderboard data
function LeaderboardScreen() {
  // Static leaderboard dataset showing major rankings
  const leaderboardData = [
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
  ];

  // Top 3 majors for quick highlight
  const topMajors = [
    { rank: 1, major: "Computer Science" },
    { rank: 2, major: "Mechanical Engineering" },
    { rank: 3, major: "Electrical Engineering" },
  ];

  // User's current experience points
  const currentXP = 10500;

  return (
    <>
      {/* Header section displaying title and XP */}
      <HeaderBar title="Leaderboard" xp={currentXP} />

      {/* Main content container */}
      <Container className="py-3 mb-5">
        {/* Card showing top 3 majors */}
        <TopMajorsCard topMajors={topMajors} />

        {/* Graph showing XP progression or trends */}
        <MajorGraphCard />

        {/* Full leaderboard table */}
        <LeaderboardTable data={leaderboardData} />
      </Container>

      {/* Bottom navigation bar */}
      <BottomNav />
    </>
  );
}

export default LeaderboardScreen;
