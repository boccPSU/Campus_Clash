import React, { useRef, useEffect, useState } from "react";
import { Container } from "react-bootstrap";

import useCollapseOnScroll from "../../components/hooks/useCollapseOnScroll.js";
import PullToRefresh from "../../components/interaction/PullToRefresh.js";
import ScreenScroll from "../../components/ScreenScroll/ScreenScroll.js";
import BottomNavBar from "../../newComponents/BottomNavBar/BottomNavBar.js";
import NewTournamentCard from "../../newComponents/NewTournamentCard/NewTournamentCard.js";
import XpHeaderBar from "../../newComponents/XpHeaderBar/XpHeaderBar.js";

function NewTournamentScreen() {
    // Time variables for tournament refresh

    // Short times for testing
    const dailyRefreshTime = 30000; // 10s
    // const weeklyRefreshTime = 90000; // 30s
    const rankedRefreshTime = 5 * 60000; // 60s
    //const dailyRefreshTime = 24 * 60 * 60 * 1000;
    const weeklyRefreshTime = 7 * 24 * 60 * 60 * 1000;
    // const rankedRefreshTime = 14 * 24 * 60 * 60 * 1000;

    const betweenTournamentTime = 30000; // For testing
    //const betweenTournamentTime = 5 * 60 * 1000; // 5 minutes between tournaments to alert users of winners

    // In-between flags (show old card, count down to next start)
    const [dailyInBetween, setDailyInBetween] = useState(false);
    const [weeklyInBetween, setWeeklyInBetween] = useState(false);
    const [rankedInBetween, setRankedInBetween] = useState(false);

    // Logged-in student's major (default to CS so existing behavior still works until we fetch real major)
    const [major, setMajor] = useState(null);

    // Remaining time for display purposes (always "relevant" countdown)
    const [dailyRemainingTime, setDailyRemainingTime] = useState(); // in ms
    const [weeklyRemainingTime, setWeeklyRemainingTime] = useState(); // in ms
    const [rankedRemainingTime, setRankedRemainingTime] = useState(); // in ms

    // Current tournaments (what cards are showing)
    const [dailyTournament, setDailyTournament] = useState([
        {
            id: "", // tid from backend
            title: "Daily Tournament",
            topics: "",
            endDateLabel: "",
            endTime: Date.now() + dailyRefreshTime,
            reward: 150,
            isRanked: false,
            tournamentType: "daily",
            startTime: Date.now(),
        },
    ]);

    const [weeklyTournament, setWeeklyTournament] = useState([
        {
            id: "",
            title: "Weekly Tournament",
            topics: "",
            endDateLabel: "",
            endTime: Date.now() + weeklyRefreshTime,
            reward: 150,
            isRanked: false,
            tournamentType: "weekly",
            startTime: Date.now(),
        },
    ]);

    const [rankedTournament, setRankedTournament] = useState([
        {
            id: "",
            title: "Ranked Tournament",
            topics: "",
            endDateLabel: "",
            endTime: Date.now() + rankedRefreshTime,
            reward: 150,
            isRanked: true,
            tournamentType: "ranked",
            newTournament: true, // indicates if this is a brand new ranked tournament
            startTime: Date.now(),
        },
    ]);

    // Upcoming tournaments (created in DB, but not shown yet)
    const [dailyUpcomingTournament, setDailyUpcomingTournament] =
        useState(null);
    const [weeklyUpcomingTournament, setWeeklyUpcomingTournament] =
        useState(null);
    const [rankedUpcomingTournament, setRankedUpcomingTournament] =
        useState(null);

    const scrollerRef = useRef(null);
    const collapsed = useCollapseOnScroll(scrollerRef);

    const refresh = async () => {
        // later: maybe reload from backend
        await new Promise((r) => setTimeout(r, 700));
    };

    // Fetch logged-in student's major once on mount
    useEffect(() => {
        async function fetchStudentMajor() {
            try {
                const tokenString = localStorage.getItem("token");
                if (!tokenString) {
                    console.log(
                        "[NewTournamentScreen] No token, skipping student-major fetch."
                    );
                    return;
                }

                let tokenValue = "";
                try {
                    const parsed = JSON.parse(tokenString);
                    tokenValue = parsed.token || tokenString;
                } catch {
                    tokenValue = tokenString;
                }

                const res = await fetch(
                    "http://localhost:5000/api/student-major",
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            "jwt-token": tokenValue,
                        },
                    }
                );

                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    console.warn(
                        "[NewTournamentScreen] Failed to fetch student major:",
                        body
                    );
                    return;
                }

                const body = await res.json();
                if (body.major) {
                    setMajor(body.major);
                    console.log(
                        "[NewTournamentScreen] Using student major:",
                        body.major
                    );
                }
            } catch (e) {
                console.error(
                    "[NewTournamentScreen] Error fetching student major:",
                    e
                );
            }
        }

        fetchStudentMajor();
    }, []);

    // Ensures topics exist for major on mount / major change
    useEffect(() => {
        async function ensureTopicsForMajor() {
            try {
                await fetch(
                    "http://localhost:5000/api/tournament/generate-topics",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ major }),
                    }
                );
                // Endpoint will skip if topics already exist
            } catch (e) {
                console.log("Failed to generate topics for major. Error: " + e);
            }
        }

        if (major) {
            ensureTopicsForMajor();
        }
    }, [major]);

    // Gets a random unused topic and marks it used for a certain major
    async function getRandomTopicForMajor(majorParam) {
        const unusedRes = await fetch(
            "http://localhost:5000/api/tournament/get-topics",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ major: majorParam }),
            }
        );
        const unusedData = await unusedRes.json();
        const topics = unusedData.topics || [];

        if (!Array.isArray(topics) || topics.length === 0) {
            console.log("No topics available");
            return null;
        }

        const randomIndex = Math.floor(Math.random() * topics.length);
        const randomTopic = topics[randomIndex];

        // Mark as used
        await fetch("http://localhost:5000/api/tournament/add-used-topic", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ major: majorParam, topic: randomTopic }),
        });

        return randomTopic;
    }

    /**
     * Creates a tournament of a certain type for a major.
     * If isUpcoming = true we store it in the UpcomingTournament state,
     * but keep showing the old tournament card until the between phase ends.
     */
    async function createTournamentForType(
        majorParam,
        tournamentType,
        startTime,
        isUpcoming = false
    ) {
        try {
            // First get a random topic
            const topic = await getRandomTopicForMajor(majorParam);
            if (!topic) {
                console.log(
                    "No topic available, can not create tournament of type",
                    tournamentType
                );
                return;
            }

            // Duration tournament lasts based on type
            let intervalMs = 0;
            if (tournamentType === "daily") {
                intervalMs = dailyRefreshTime;
            } else if (tournamentType === "weekly") {
                intervalMs = weeklyRefreshTime;
            } else if (tournamentType === "ranked") {
                intervalMs = rankedRefreshTime;
            }

            const nowMs = Date.now();
            // If no explicit startTime passed, start now
            const startMs = startTime ?? nowMs;
            const endTime = startMs + intervalMs; // time new tournament will end

            const title =
                tournamentType === "daily"
                    ? "Daily Tournament"
                    : tournamentType === "weekly"
                    ? "Weekly Tournament"
                    : "Ranked Tournament";

            // Create tournament in backend
            const res = await fetch(
                "http://localhost:5000/api/create-tournament",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title,
                        topics: topic,
                        reward: 150,
                        tournamentType,
                        endTime, // ms timestamp
                        startTime: startMs,
                    }),
                }
            );

            const data = await res.json().catch(() => null);

            if (!res.ok || !data?.successful) {
                console.error(
                    "Failed to create tournament of type " + tournamentType,
                    data
                );
                return;
            }

            const newTid = data.tid;
            const newTopics = topic;
            const newEndtime = new Date(data.endDate).getTime();
            const newStartTime = new Date(data.startDate).getTime();

            const newTournamentObj = {
                id: newTid,
                title,
                topics: newTopics,
                endDateLabel: "",
                endTime: newEndtime,
                reward: 150,
                isRanked: tournamentType === "ranked",
                tournamentType,
                startTime: newStartTime,
            };

            if (tournamentType === "daily") {
                if (isUpcoming) {
                    setDailyUpcomingTournament(newTournamentObj);
                } else {
                    setDailyTournament([newTournamentObj]);
                }
            } else if (tournamentType === "weekly") {
                if (isUpcoming) {
                    setWeeklyUpcomingTournament(newTournamentObj);
                } else {
                    setWeeklyTournament([newTournamentObj]);
                }
            } else if (tournamentType === "ranked") {
                // If there is an existing ranked tournament, try to carry over participants.
                // If not, this is the very first ranked tournament and we skip the update.
                let isFinalRound = false;

                if (rankedTournament[0] && rankedTournament[0].id) {
                    try {
                        const updateRes = await fetch(
                            "http://localhost:5000/api/tournament/update-ranked-leaderboard",
                            {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    oldTid: rankedTournament[0].id, // previous round
                                    newTid: newTid, // this new round
                                }),
                            }
                        );

                        const updateData = await updateRes
                            .json()
                            .catch(() => null);

                        if (!updateRes.ok || !updateData?.successful) {
                            console.error(
                                "[Ranked] Failed to update ranked leaderboard",
                                updateData
                            );
                        } else {
                            // If continues is false, this means total <= 3 that round was final
                            // So this newTid is a brand new tournament
                            if (updateData.continues === false) {
                                console.log(
                                    "[Ranked] Previous round was final (<=3 players).",
                                    "Starting a brand new ranked tournament."
                                );
                                isFinalRound = true;
                            } else {
                                console.log(
                                    "[Ranked] Ranked tournament continues to next round.",
                                    "keepCount =",
                                    updateData.keepCount
                                );
                            }
                        }
                    } catch (err) {
                        console.error(
                            "[Ranked] Error calling update-ranked-leaderboard:",
                            err
                        );
                    }
                } else {
                    console.log(
                        "[Ranked] No existing ranked tournament id, treating this as a brand new ranked tournament."
                    );
                    // First ranked ever: no oldTid to carry from, so it's a brand new tournament.
                    isFinalRound = true;
                }

                // Mark on the *new* tournament whether it's a brand new bracket (no previous winners carrying in)
                newTournamentObj.newTournament = isFinalRound;

                if (isUpcoming) {
                    setRankedUpcomingTournament(newTournamentObj);
                } else {
                    setRankedTournament([newTournamentObj]);
                }
            }
        } catch (err) {
            console.error("Error creating tournament:", err);
        }
    }

    // On mount, load current tournaments or create new ones
    useEffect(() => {
        async function loadOrCreate() {
            const now = Date.now();

            try {
                const res = await fetch(
                    "http://localhost:5000/api/tournament/current-tournaments",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                    }
                );

                const data = await res.json().catch(() => null);

                if (!res.ok || !data?.successful) {
                    console.log(
                        "Failed to load current tournaments, creating new ones"
                    );
                    await createTournamentForType(major, "daily");
                    await createTournamentForType(major, "weekly");
                    await createTournamentForType(major, "ranked");
                    return;
                }

                // DAILY
                if (data.daily) {
                    const endMs = data.daily.endDate
                        ? new Date(data.daily.endDate).getTime()
                        : 0;

                    console.log(
                        "Loaded existing daily tournament with end time:",
                        endMs
                    );

                    if (endMs > now) {
                        setDailyTournament([
                            {
                                id: data.daily.tid,
                                title: data.daily.title,
                                topics: data.daily.topics,
                                endDateLabel: "",
                                endTime: endMs,
                                reward: data.daily.reward,
                                isRanked: false,
                                tournamentType: "daily",
                                // If backend returns startTime, you can map it here:
                                // startTime: new Date(data.daily.startTime).getTime(),
                                startTime: Date.now(),
                            },
                        ]);
                    } else {
                        console.log("Existing daily expired, creating new");
                        await createTournamentForType(major, "daily");
                    }
                } else {
                    await createTournamentForType(major, "daily");
                }

                // WEEKLY
                if (data.weekly) {
                    const endMs = data.weekly.endDate
                        ? new Date(data.weekly.endDate).getTime()
                        : 0;
                    console.log(
                        "Loaded existing weekly tournament with end time:",
                        endMs
                    );
                    if (endMs > now) {
                        setWeeklyTournament([
                            {
                                id: data.weekly.tid,
                                title: data.weekly.title,
                                topics: data.weekly.topics,
                                endDateLabel: "",
                                endTime: endMs,
                                reward: data.weekly.reward,
                                isRanked: false,
                                tournamentType: "weekly",
                                startTime: Date.now(),
                            },
                        ]);
                    } else {
                        console.log("Existing weekly expired, creating new");
                        await createTournamentForType(major, "weekly");
                    }
                } else {
                    await createTournamentForType(major, "weekly");
                }

                // RANKED
                if (data.ranked) {
                    const endMs = data.ranked.endDate
                        ? new Date(data.ranked.endDate).getTime()
                        : 0;
                    console.log(
                        "Loaded existing ranked tournament with end time:",
                        endMs
                    );
                    if (endMs > now) {
                        setRankedTournament([
                            {
                                id: data.ranked.tid,
                                title: data.ranked.title,
                                topics: data.ranked.topics,
                                endDateLabel: "",
                                endTime: endMs,
                                reward: data.ranked.reward,
                                isRanked: true,
                                tournamentType: "ranked",
                                startTime: Date.now(),
                                newTournament: true,
                                tournamentCount: 0,
                            },
                        ]);
                    } else {
                        console.log("Existing ranked expired, creating new");
                        await createTournamentForType(major, "ranked");
                    }
                } else {
                    await createTournamentForType(major, "ranked");
                }
            } catch (e) {
                console.log(
                    "Failed to load current tournaments. Creating fresh ones. Error:",
                    e
                );
                await createTournamentForType(major, "daily");
                await createTournamentForType(major, "weekly");
                await createTournamentForType(major, "ranked");
            }
        }

        if (major) {
            loadOrCreate();
        }
    }, [major]);

    // Timer to rotate tournaments out when their endTime passes
    useEffect(() => {
        const tick = async () => {
            const now = Date.now();

            const daily = dailyTournament[0];
            const weekly = weeklyTournament[0];
            const ranked = rankedTournament[0];

            // ---- DAILY ----
            if (daily) {
                if (dailyInBetween) {
                    // Between tournaments: we use upcoming's startTime for countdown
                    if (dailyUpcomingTournament) {
                        setDailyRemainingTime(
                            dailyUpcomingTournament.startTime - now
                        );

                        if (now >= dailyUpcomingTournament.startTime) {
                            console.log("Ending daily in between state");
                            setDailyInBetween(false);
                            setDailyTournament([dailyUpcomingTournament]);
                            setDailyUpcomingTournament(null);
                        }
                    }
                } else if (daily.id && daily.endTime && now >= daily.endTime) {
                    // Tournament is over

                    // Award XP to winners here

                    // Just ended: go into between phase & schedule the next tournament
                    setDailyInBetween(true);

                    const nextStartTime = now + betweenTournamentTime;

                    await createTournamentForType(
                        major,
                        "daily",
                        nextStartTime,
                        true // isUpcoming
                    );
                } else if (daily.endTime) {
                    // Active tournament: count down to end
                    setDailyRemainingTime(daily.endTime - now);
                }
            }

            // ---- WEEKLY ----
            if (weekly) {
                if (weeklyInBetween) {
                    if (weeklyUpcomingTournament) {
                        setWeeklyRemainingTime(
                            weeklyUpcomingTournament.startTime - now
                        );

                        if (now >= weeklyUpcomingTournament.startTime) {
                            console.log("Ending weekly in between state");
                            setWeeklyInBetween(false);
                            setWeeklyTournament([weeklyUpcomingTournament]);
                            setWeeklyUpcomingTournament(null);
                        }
                    }
                } else if (
                    weekly.id &&
                    weekly.endTime &&
                    now >= weekly.endTime
                ) {
                    // Award XP to winners here

                    setWeeklyInBetween(true);

                    const nextStartTime = now + betweenTournamentTime;

                    await createTournamentForType(
                        major,
                        "weekly",
                        nextStartTime,
                        true
                    );
                } else if (weekly.endTime) {
                    setWeeklyRemainingTime(weekly.endTime - now);
                }
            }

            // ---- RANKED ----
            if (ranked) {
                if (rankedInBetween) {
                    if (rankedUpcomingTournament) {
                        setRankedRemainingTime(
                            rankedUpcomingTournament.startTime - now
                        );

                        if (now >= rankedUpcomingTournament.startTime) {
                            console.log("Ending ranked in between state");
                            setRankedInBetween(false);
                            setRankedTournament([rankedUpcomingTournament]);
                            setRankedUpcomingTournament(null);
                        }
                    }
                } else if (
                    ranked.id &&
                    ranked.endTime &&
                    now >= ranked.endTime
                ) {
                    // Award XP to winners here

                    setRankedInBetween(true);

                    const nextStartTime = now + betweenTournamentTime;
                    // TODO: Update winners XP here (and handle final winner if keepGoing=false)
                    await createTournamentForType(
                        major,
                        "ranked",
                        nextStartTime,
                        true
                    );
                } else if (ranked.endTime) {
                    setRankedRemainingTime(ranked.endTime - now);
                }
            }
        };

        const intervalId = setInterval(() => {
            tick();
        }, 1000);

        return () => clearInterval(intervalId);
    }, [
        dailyTournament,
        weeklyTournament,
        rankedTournament,
        major,
        dailyInBetween,
        weeklyInBetween,
        rankedInBetween,
        dailyUpcomingTournament,
        weeklyUpcomingTournament,
        rankedUpcomingTournament,
    ]);

    // Helper function to format time from ms to d h m s
    function formatRemainingTime(ms) {
        if (!Number.isFinite(ms)) {
            return "";
        }

        if (ms <= 0) {
            return "Expired";
        }

        const totalSeconds = Math.floor(ms / 1000);

        const days = Math.floor(totalSeconds / (24 * 60 * 60));
        const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
        const seconds = totalSeconds % 60;

        const parts = [];

        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);

        // Only show seconds if we have < 1 minute left and no larger units
        if (parts.length === 0 && seconds > 0) {
            parts.push(`${seconds}s`);
        }

        return parts.join(" ");
    }

    // For ranked: decide if the just-ended tournament is a final tournament or just a round.
    const rankedIsFinalInBetween = rankedInBetween && !rankedUpcomingTournament;

    return (
        <>
            <ScreenScroll ref={scrollerRef}>
                <PullToRefresh scrollerRef={scrollerRef} onRefresh={refresh}>
                    <Container className="mainContainer">
                        {/* Progress bar */}
                        <XpHeaderBar
                            level={1}
                            currentXp={50}
                            xpForNextLevel={100}
                        ></XpHeaderBar>

                        {/* Tournament Screen Header */}
                        <div
                            className={`tournamentHeader ${
                                collapsed ? "tournamentHeaderCollapsed" : ""
                            }`}
                        >
                            <h1 className="tournamentTitle">Tournaments</h1>
                        </div>

                        {/* Daily Section */}
                        <div className="tournamentSection">
                            <div className="sectionHeader">
                                <h2 className="sectionTitle">Daily</h2>
                                <p className="tournamentTimer">
                                    {dailyInBetween ? (
                                        <>
                                            Next tournament starts in:{" "}
                                            {formatRemainingTime(
                                                dailyRemainingTime
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            Tournament ends in:{" "}
                                            {formatRemainingTime(
                                                dailyRemainingTime
                                            )}
                                        </>
                                    )}
                                </p>
                            </div>

                            <div className="tournamentCardWrapper">
                                {/* During in-between, we still show the OLD tournament card */}
                                <NewTournamentCard
                                    tid={dailyTournament[0].id}
                                    title={dailyTournament[0].title}
                                    topics={dailyTournament[0].topics}
                                    reward={dailyTournament[0].reward}
                                    remainingTime={dailyRemainingTime}
                                    isRanked={dailyTournament[0].isRanked}
                                    tournamentType={
                                        dailyTournament[0].tournamentType
                                    }
                                    tournamentOver={dailyInBetween}
                                    NewTournament={true} // not used for non-ranked, safe default
                                />
                            </div>
                        </div>

                        {/* Weekly Section */}
                        <div className="tournamentSection">
                            <div className="sectionHeader">
                                <h2 className="sectionTitle">Weekly</h2>
                                <p className="tournamentTimer">
                                    {weeklyInBetween ? (
                                        <>
                                            Next tournament starts in:{" "}
                                            {formatRemainingTime(
                                                weeklyRemainingTime
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            Tournament ends in:{" "}
                                            {formatRemainingTime(
                                                weeklyRemainingTime
                                            )}
                                        </>
                                    )}
                                </p>
                            </div>
                            <div className="tournamentCardWrapper">
                                <NewTournamentCard
                                    tid={weeklyTournament[0].id}
                                    title={weeklyTournament[0].title}
                                    topics={weeklyTournament[0].topics}
                                    reward={weeklyTournament[0].reward}
                                    remainingTime={weeklyRemainingTime}
                                    isRanked={weeklyTournament[0].isRanked}
                                    tournamentType={
                                        weeklyTournament[0].tournamentType
                                    }
                                    tournamentOver={weeklyInBetween}
                                    NewTournament={true} // not used for non-ranked
                                />
                            </div>
                        </div>

                        {/* Ranked Section */}
                        <div className="tournamentSection">
                            <div className="sectionHeader">
                                <h2 className="sectionTitle">Ranked</h2>
                                <p className="tournamentTimer">
                                    {rankedInBetween ? (
                                        <>
                                            Next tournament starts in:{" "}
                                            {formatRemainingTime(
                                                rankedRemainingTime
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            Tournament ends in:{" "}
                                            {formatRemainingTime(
                                                rankedRemainingTime
                                            )}
                                        </>
                                    )}
                                </p>
                            </div>
                            <div className="tournamentCardWrapper">
                                <NewTournamentCard
                                    tid={rankedTournament[0].id}
                                    title={rankedTournament[0].title}
                                    topics={rankedTournament[0].topics}
                                    reward={rankedTournament[0].reward}
                                    remainingTime={rankedRemainingTime}
                                    isRanked={rankedTournament[0].isRanked}
                                    tournamentType={
                                        rankedTournament[0].tournamentType
                                    }
                                    tournamentOver={rankedInBetween}
                                    
                                    NewTournament={
                                        rankedInBetween
                                            ? rankedIsFinalInBetween
                                            : false
                                    }
                                />
                            </div>
                        </div>

                        {/* Spacer so content doesn't hide behind BottomNavBar */}
                        <div className="bottomNavSpacer" />
                    </Container>
                </PullToRefresh>
            </ScreenScroll>

            <BottomNavBar />
        </>
    );
}

export default NewTournamentScreen;
