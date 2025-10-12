import React from "react";
import { Container } from "react-bootstrap";
import BottomNav from "../components/BottomNav";
import TournamentCard from "../components/TournamentCard";
import HeaderBar from "../components/HeaderBar";
import "../index.scss";

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

  return (
    <>
      {/* Top navigation header */}
      <HeaderBar title="Tournaments" xp={currentXP} />

      <Container className="py-3 mb-5 text-center">
        {/* Section heading */}
        <h5 className="fw-bold mb-4 text-dark">Available Tournaments</h5>

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

      {/* Persistent bottom navigation */}
      <BottomNav />
    </>
  );
}

export default TournamentScreen;
