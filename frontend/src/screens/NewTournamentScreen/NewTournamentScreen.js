import React, { useRef, useEffect, useState } from "react";
import { Container, ProgressBar } from "react-bootstrap";

import useCollapseOnScroll from "../../components/hooks/useCollapseOnScroll.js";
import PullToRefresh from "../../components/interaction/PullToRefresh.js";
import ScreenScroll from "../../components/ScreenScroll/ScreenScroll.js";
import BottomNavBar from "../../newComponents/BottomNavBar/BottomNavBar.js";
import NewTournamentCard from "../../newComponents/NewTournamentCard/NewTournamentCard.js";

function NewTournamentScreen() {
    // Time variables for tournament refresh

    //Short times for testing
    //const dailyRefreshTime = 60000; // 10s
    //const weeklyRefreshTime = 90000; // 30s
    //const rankedRefreshTime = 100000; // 60s
     const dailyRefreshTime = 24 * 60 * 60 * 1000;
     const weeklyRefreshTime = 7 * 24 * 60 * 60 * 1000;
     const rankedRefreshTime = 14 * 24 * 60 * 60 * 1000;

    const major = "Computer Science"; // later: use logged-in student’s major

    // Tournament states 
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
        },
    ]);

    const scrollerRef = useRef(null);
    const collapsed = useCollapseOnScroll(scrollerRef);

    // Current time for countdowns
    const [now, setNow] = useState(Date.now());

    // Tick every second
    useEffect(() => {
        const id = setInterval(() => {
            //console.log("Tick");
            setNow(Date.now());
        }, 1000); // 1 second

        return () => clearInterval(id);
    }, []);

    const refresh = async () => {
        // later: maybe reload from backend
        await new Promise((r) => setTimeout(r, 700));
    };

    // Ensures topics exists for major on mount
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

        ensureTopicsForMajor();
    }, [major]);

    // Gets a random un used topic and marks it used for a certain major
    async function getRandomTopicForMajor(majorParam) {
        //console.log("Fetching a topic for ", majorParam);
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
        //console.log("Topic fetched ", topics);

        if (!Array.isArray(topics) || topics.length === 0) {
            console.log("No topics available");
            return null;
        }

        const randomIndex = Math.floor(Math.random() * topics.length);
        const randomTopic = topics[randomIndex];
        //console.log("Chosen Topic: ", randomTopic);

        // Mark as used
        await fetch("http://localhost:5000/api/tournament/add-used-topic", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ major: majorParam, topic: randomTopic }),
        });

        return randomTopic;
    }

    
    // Creates a tournament of a certain type for a major

    async function createTournamentForType(majorParam, tournamentType) {
        try {
            // First get a random topic
            const topic = await getRandomTopicForMajor(majorParam);
            if (!topic) {
                console.log("No topic available, can not create tournament of type", tournamentType);
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

            const now = Date.now();
            const endTime = now + intervalMs;   // time new torunament will end

            // Get title depending on tournamnet type
            const title =
                tournamentType === "daily"
                    ? "Daily Tournament"
                    : tournamentType === "weekly"
                    ? "Weekly Tournament"
                    : "Ranked Tournament";

            console.log(`Creating tournament of type ${tournamentType} with topic ${topic} and end time ${new Date(endTime).toISOString()}`);


            // Create touranament in backend
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
                    }),
                }
            );

            const data = await res.json().catch(() => null);

            if (!res.ok || !data?.successful) {
                console.error(
                    "Failed to create tournametn of type " + tournamentType,
                    data
                );
                return;
            }

            const newTid = data.tid;
            const newTopics = topic;
            const newEndtime = data.endDate;
            console.log("Successfully created tournament:", data);

            // Update tournament state locally 
            if (tournamentType === "daily") {
                setDailyTournament([
                    {
                        id: newTid,
                        title,
                        topics: newTopics,
                        endDateLabel: "",
                        endTime: newEndtime,
                        reward: 150,
                        isRanked: false,
                        tournamentType: "daily",
                    },
                ]);
            } else if (tournamentType === "weekly") {
                setWeeklyTournament([
                    {
                        id: newTid,
                        title,
                        topics: newTopics,
                        endDateLabel: "",
                        endTime: newEndtime,
                        reward: 150,
                        isRanked: false,
                        tournamentType: "weekly",
                    },
                ]);
            } else if (tournamentType === "ranked") {
                setRankedTournament([
                    {
                        id: newTid,
                        title,
                        topics: newTopics,
                        endDateLabel: "",
                        endTime: newEndtime,
                        reward: 150,
                        isRanked: true,
                        tournamentType: "ranked",
                    },
                ]);
            }
        } catch (err) {
            console.error(
                "Error creating tournament:",
                err
            );
        }
    }

    // On mount, load current tournaments or create new ones
    useEffect(() => {
        async function loadOrCreate() {
            const now = Date.now();

            try {
                // Load most current tournaments from backend
                const res = await fetch(
                    "http://localhost:5000/api/tournament/current-tournaments",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                    }
                );

                const data = await res.json().catch(() => null);

                if (!res.ok || !data?.successful) {
                    console.log(" Failed to load current tournaments, creating new ones");
                    await createTournamentForType(major, "daily");
                    await createTournamentForType(major, "weekly");
                    await createTournamentForType(major, "ranked");
                    return;
                }

                // Daily tournaments
                if (data.daily) {
                    const endMs = data.daily.endDate
                        ? new Date(data.daily.endDate).getTime()
                        : 0;

                    console.log("Loaded existing daily tournament with end time:", endMs);

                    if (endMs > now) {
                        // Tournament not expired yet, use it
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
                    console.log("Loaded existing weekly tournament with end time:", endMs);
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
                    console.log("Loaded existing ranked tournament with end time:", endMs);
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

        loadOrCreate();
    }, [major]); // run once on mount


    // Timer to rotate tournaments out when there endtime passes
    useEffect(() => {
        const tick = async () => {
            // Get current time
            const now = Date.now();

            // Get all current tournaments
            const daily = dailyTournament[0];
            const weekly = weeklyTournament[0];
            const ranked = rankedTournament[0];

            console.log("Checking each tournament expiration. Daily ends at:", daily.endTime, "Weekly ends at:", weekly.endTime, "Ranked ends at:", ranked.endTime, "Now:", now);

            if (daily && daily.id && daily.endTime && now >= daily.endTime) {
                console.log("Daily timer expired, creating new daily");
                await createTournamentForType(major, "daily");
            }

            if (weekly && weekly.id && weekly.endTime && now >= weekly.endTime) {
                console.log("Weekly timer expired, creating new weekly");
                await createTournamentForType(major, "weekly");
            }

            if (ranked && ranked.id && ranked.endTime && now >= ranked.endTime) {
                console.log("Ranked timer expired, creating new ranked");
                await createTournamentForType(major, "ranked");
            }
        };

        // Check every 10 seconds
        const intervalId = setInterval(() => {
            tick();
        }, 10 * 1000);

        return () => clearInterval(intervalId);
    }, [dailyTournament, weeklyTournament, rankedTournament, major]);

    return (
        <>
            <ScreenScroll ref={scrollerRef}>
                <PullToRefresh scrollerRef={scrollerRef} onRefresh={refresh}>
                    <Container className="mainContainer">
                        {/* Progress Bar */}
                        <div className="xpHeader">
                            <h3>Level 10</h3>
                            <ProgressBar now={60} />
                            <p>100 / 1000 XP</p>
                        </div>

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
                                <h2 className="sectionTitle">
                                    Daily Flashcards
                                </h2>
                                {/* TODO: compute next-tournament text from endTime if you want */}
                                
                            </div>

                            {dailyTournament.map((t, i) => (
                                <div className="tournamentCardWrapper" key={i}>
                                    <NewTournamentCard
                                        tid={t.id}
                                        title={t.title}
                                        topics={t.topics}
                                        reward={t.reward}
                                        endTime={t.endTime}
                                        isRanked={t.isRanked}
                                        tournamentType={t.tournamentType}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Weekly Section */}
                        <div className="tournamentSection">
                            <h2 className="sectionTitle">Weekly Flashcards</h2>

                            {weeklyTournament.map((t, i) => (
                                <div className="tournamentCardWrapper" key={i}>
                                    <NewTournamentCard
                                        tid={t.id}
                                        title={t.title}
                                        topics={t.topics}
                                        reward={t.reward}
                                        endTime={t.endTime}
                                        isRanked={t.isRanked}
                                        tournamentType={t.tournamentType}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Ranked Section */}
                        <div className="tournamentSection">
                            <h2 className="sectionTitle">Ranked Flashcards</h2>

                            {rankedTournament.map((t, i) => (
                                <div className="tournamentCardWrapper" key={i}>
                                    <NewTournamentCard
                                        tid={t.id}
                                        title={t.title}
                                        topics={t.topics}
                                        reward={t.reward}
                                        endTime={t.endTime}
                                        isRanked={t.isRanked}
                                        tournamentType={t.tournamentType}
                                    />
                                </div>
                            ))}
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
