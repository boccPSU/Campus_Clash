import React from "react";
import { Nav } from "react-bootstrap";
import NavButton from "./NavButton";
import {
  HouseDoorFill,
  CalendarEventFill,
  TrophyFill,
  PersonFill,
  BarChartFill,
} from "react-bootstrap-icons";

function BottomNav() {
  return (
    <Nav className="justify-content-around bg-primary fixed-bottom border-top py-2">

      <NavButton to="/leaderboard" icon={BarChartFill} label="Leaderboard" />
      <NavButton to="/events" icon={CalendarEventFill} label="Events" />
      <NavButton to="/" icon={HouseDoorFill} label="Home" size={26} exact />
      <NavButton to="/battle" icon={TrophyFill} label="Battle" />
      <NavButton to="/tournament" icon={PersonFill} label="Tournament" />
    </Nav>
  );
}

export default BottomNav;