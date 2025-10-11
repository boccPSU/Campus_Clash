import React from "react";
import { Container } from "react-bootstrap";
import BottomNav from "../components/BottomNav";
import TournamentCard from "../components/TournamentCard";
import HeaderBar from "../components/HeaderBar";
import "../index.scss";

function TournamentScreen() {
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

  const currentXP = 10500;

  return (
    <>
      <HeaderBar title="Tournaments" xp={currentXP} />

      <Container className="py-3 mb-5 text-center">
        {/* Section Title */}
        <h5 className="fw-bold mb-4 text-dark">Available Tournaments</h5>

        {/* Tournament List */}
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

      <BottomNav />
    </>
  );
}

export default TournamentScreen;
