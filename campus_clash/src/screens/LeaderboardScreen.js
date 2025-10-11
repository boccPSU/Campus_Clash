import React from "react";
import { Container } from "react-bootstrap";
import BottomNav from "../components/BottomNav";
import TopMajorsCard from "../components/TopMajorsCard";
import MajorGraphCard from "../components/MajorGraphCard";
import LeaderboardTable from "../components/LeaderboardTable";
import HeaderBar from "../components/HeaderBar";

function LeaderboardScreen() {
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

  const topMajors = [
    { rank: 1, major: "Computer Science" },
    { rank: 2, major: "Mechanical Engineering" },
    { rank: 3, major: "Electrical Engineering" },
  ];

  const currentXP = 10500;

  return (
    <>
      <HeaderBar title="Leaderboard" xp={currentXP} />

      <Container className="py-3 mb-5">
        <TopMajorsCard topMajors={topMajors} />
        <MajorGraphCard />
        <LeaderboardTable data={leaderboardData} />
      </Container>

      <BottomNav />
    </>
  );
}

export default LeaderboardScreen;
