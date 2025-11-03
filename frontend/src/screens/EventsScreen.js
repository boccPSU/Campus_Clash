import React, { useEffect, useRef, useState } from "react";
import { Container, ButtonGroup, ToggleButton } from "react-bootstrap";
import EventCard from "../components/EventCard/EventCard.js";
import BottomNav from "../components/BottomNav/BottomNav.js";
import HeaderBar from "../components/HeaderBar/HeaderBar.js";
import InfoBox from "../components/InfoBox/InfoBox.js";
import CreateEventButton from "../components/CreateEventButton/CreateEventButton.js";
import useCollapseOnScroll from "../components/hooks/useCollapseOnScroll.js";
import PullToRefresh from "../components/interaction/PullToRefresh.js";
import ScreenScroll from "../components/ScreenScroll/ScreenScroll.js";

function EventsScreen() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const filters = ["All Events", "This Week", "Academic", "Sports"]; // stub for future
    const currentXP = 10500;

    // Collapsing header + PTR wiring
    const scrollerRef = useRef(null);
    const collapsed = useCollapseOnScroll(scrollerRef);

    const loadEvents = async () => {
        setErr("");
        setLoading(true);
        try {
            const res = await fetch("http://localhost:5000/api/events");
            const data = await res.json();
            if (!res.ok) throw new Error("Failed to fetch events");

            // Map DB rows -> EventCard props
            const mapped = (Array.isArray(data) ? data : []).map((row) => {
                const subtitle =
                    row.subtitle && row.subtitle.trim().length > 0
                        ? row.subtitle
                        : (row.description || "").slice(0, 140) +
                          ((row.description || "").length > 140 ? "…" : "");
                return {
                    // EventCard expects these:
                    title: row.title,
                    subtitle,
                    date: "", 
                    location: row.location || "",
                    xp: row.xp ?? 0,
                };
            });
			
            setEvents(mapped);
        } catch (e) {
            console.error(e);
            setErr("Could not load events.");
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEvents();
    }, []);

    const refresh = async () => {
        await loadEvents();
    };

    const handleCreated = async () => {
        await loadEvents(); // refresh list after creating an event
    };

    return (
        <>
            <HeaderBar
                title="Campus Events"
                xp={currentXP}
                collapsed={collapsed}
            />
            <div
                className={`headerSpacer ${collapsed ? "is-collapsed" : ""}`}
            />

            <ScreenScroll ref={scrollerRef}>
                <PullToRefresh scrollerRef={scrollerRef} onRefresh={refresh}>
                    <Container className="py-3 mb-5" tabIndex={-1}>
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

                        <InfoBox title="Events">
                            <div className="mb-3">
                                <CreateEventButton onCreated={handleCreated} />
                            </div>

                            {loading && (
                                <div className="text-muted">
                                    Loading events…
                                </div>
                            )}
                            {!loading && err && (
                                <div className="text-danger">{err}</div>
                            )}
                            {!loading && !err && events.length === 0 && (
                                <div className="text-muted">
                                    No events yet. Create one!
                                </div>
                            )}
                            {!loading &&
                                !err &&
                                events.map((e, i) => (
                                    <EventCard key={i} {...e} />
                                ))}
                        </InfoBox>
                    </Container>
                </PullToRefresh>

                <div style={{ height: "var(--bottom-nav-height, 72px)" }} />
            </ScreenScroll>

            <BottomNav />
        </>
    );
}

export default EventsScreen;
