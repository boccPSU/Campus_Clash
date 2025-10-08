import React from "react";
import { Container, ButtonGroup, ToggleButton } from "react-bootstrap";
import EventCard from "../components/EventCard";
import BottomNav from "../components/BottomNav";

function EventsScreen() {
  const events = [
    {
      title: "Men’s Soccer Game",
      subtitle: "Home vs Westminster",
      date: "Sept 27, 7 p.m.",
      location: "",
      xp: 500
    },
    {
      title: "Health and Wellness Fair",
      subtitle: "Join for games, fruit, giveaways, music, and more!",
      date: "Sept 19 & Sept 22, 10 a.m. – 3 p.m.",
      location: "Well Being Boulevard",
      xp: 600
    },
    {
      title: "Philosophy Club Open Dialogue",
      subtitle: "Explore new ideas and discuss freely.",
      date: "Oct 1, 6 p.m.",
      location: "Room 204, Main Hall",
      xp: 400
    }
  ];

  const filters = ["All Events", "This Week", "Academic", "Sports"];

  return (
    <>
      <div className="bg-primary text-white text-center py-2">
        <h5 className="m-0">Campus Events</h5>
      </div>

      <Container className="py-3">
        <ButtonGroup className="mb-3 w-100">
          {filters.map((f, i) => (
            <ToggleButton
              key={i}
              type="radio"
              variant="outline-primary"
              name="filter"
              value={f}
            >
              {f}
            </ToggleButton>
          ))}
        </ButtonGroup>

        {events.map((e, i) => (
          <EventCard key={i} {...e} />
        ))}
      </Container>

      <BottomNav />
    </>
  );
}

export default EventsScreen;
