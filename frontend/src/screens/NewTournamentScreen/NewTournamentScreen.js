import React, { useRef, useEffect, useState } from "react";
import { Container } from "react-bootstrap";

import useCollapseOnScroll from "../../components/hooks/useCollapseOnScroll.js";
import PullToRefresh from "../../components/interaction/PullToRefresh.js";
import ScreenScroll from "../../components/ScreenScroll/ScreenScroll.js";
import BottomNavBar from "../../newComponents/BottomNavBar/BottomNavBar.js";
import NewTournamentCard from "../../newComponents/NewTournamentCard/NewTournamentCard.js";
import XpHeaderBar from "../../newComponents/XpHeaderBar/XpHeaderBar.js";
import MainPopup from "../../newComponents/MainPopup/MainPopup.js";
import { Gem } from "react-bootstrap-icons";
import { useAuth } from "../../api/AuthContext";

function NewTournamentScreen() {
    const { token, studentData, loadBasicStudentData, setStudentData } =
        useAuth();
    // Leveling constraints (same as XpHeaderBar)
    const BASE_XP_PER_LEVEL = 200;
    const XP_INCREMENT_PER_LEVEL = 100;
    const GEMS_PER_LEVEL = 100;

    // Time variables for tournament refresh

    const dailyRefreshTime = 24 * 60 * 60 * 1000;
    const weeklyRefreshTime = 7 * 24 * 60 * 60 * 1000;
    const rankedRefreshTime = 14 * 24 * 60 * 60 * 1000;
    const FORCE_END_IN_MS = 10_000; // 10 seconds

    // Time between tournaments
    const betweenTournamentTime = 15000; // testing: 15 seconds

    // In-between flags (show old card, count down to next start)
    const [dailyInBetween, setDailyInBetween] = useState(false);
    const [weeklyInBetween, setWeeklyInBetween] = useState(false);
    const [rankedInBetween, setRankedInBetween] = useState(false);

    // Logged-in student's major
    const [major, setMajor] = useState(studentData?.major);

    // Remaining time for display purposes
    const [dailyRemainingTime, setDailyRemainingTime] = useState(0); // in ms
    const [weeklyRemainingTime, setWeeklyRemainingTime] = useState(0); // in ms
    const [rankedRemainingTime, setRankedRemainingTime] = useState(0); // in ms

    // Loading a tournament
    const [loadingTournament, setLoadingTournament] = useState(false);

    // Level up info
    const [lastLevel, setLastLevel] = useState(null);
    const [showLevelUpPopup, setShowLevelUpPopup] = useState(false);
    const [justLeveledTo, setJustLeveledTo] = useState(null);
    const [levelUpGemsAwarded, setLevelUpGemsAwarded] = useState(0);
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

    // 🔹 ref to hold the polling interval id
    const studentRefreshIntervalRef = useRef(null);

    // REMOVE THIS LATER
    const refresh = async () => {
        // later: maybe reload from backend
        await new Promise((r) => setTimeout(r, 700));
    };

    // refresh student data once per second for 5 seconds
    function startStudentDataRefreshBurst() {
        // Avoid overlapping bursts
        if (studentRefreshIntervalRef.current) {
            clearInterval(studentRefreshIntervalRef.current);
            studentRefreshIntervalRef.current = null;
        }

        let count = 0;
        console.log(
            "[NewTournamentScreen] Starting student data refresh burst (5 seconds)"
        );

        // Immediate first refresh
        loadBasicStudentData();
        count++;

        const id = setInterval(() => {
            if (count >= 5) {
                clearInterval(id);
                studentRefreshIntervalRef.current = null;
                console.log(
                    "[NewTournamentScreen] Student data refresh burst completed"
                );
                return;
            }

            console.log(
                `[NewTournamentScreen] Student data refresh burst tick ${
                    count + 1
                }`
            );
            loadBasicStudentData();
            count++;
        }, 1000);

        studentRefreshIntervalRef.current = id;
    }

    // Helper function to compute level info based on total xp
    function computeLevelInfo(totalXp) {
        let level = 1;
        let xpRemaining = totalXp;
        let costForNextLevel = BASE_XP_PER_LEVEL;

        while (xpRemaining >= costForNextLevel) {
            xpRemaining -= costForNextLevel;
            level += 1;
            costForNextLevel += XP_INCREMENT_PER_LEVEL;
        }

        return {
            level,
            currentXp: xpRemaining,
            xpForNextLevel: costForNextLevel,
        };
    }

    // cleanup burst interval on unmount
    useEffect(() => {
        return () => {
            if (studentRefreshIntervalRef.current) {
                clearInterval(studentRefreshIntervalRef.current);
            }
        };
    }, []);

    // Detect level up when studentData.xp changes
    useEffect(() => {
        if (!studentData || typeof studentData.xp !== "number") {
            return;
        }

        const totalXp = studentData.xp;
        const { level } = computeLevelInfo(totalXp);

        const levelKey = studentData.username
            ? `lastLevel_${studentData.username}`
            : "lastLevel";

        if (lastLevel === null) {
            const stored = sessionStorage.getItem(levelKey);
            const initialLevel = stored ? parseInt(stored, 10) : level;
            setLastLevel(initialLevel);
            if (!stored) {
                sessionStorage.setItem(levelKey, String(initialLevel));
            }
            return;
        }

        if (level <= lastLevel) {
            return;
        }

        const levelsGained = level - lastLevel;
        const gemsToAward = levelsGained * GEMS_PER_LEVEL;

        console.log(
            `[SCREEN] Level up detected: lastLevel=${lastLevel}, newLevel=${level}, levelsGained=${levelsGained}, gemsToAward=${gemsToAward}`
        );

        setJustLeveledTo(level);
        setLevelUpGemsAwarded(gemsToAward);
        setShowLevelUpPopup(true);

        setLastLevel(level);
        sessionStorage.setItem(levelKey, String(level));

        (async () => {
            try {
                const username = studentData.username;
                if (!username) {
                    console.warn("[SCREEN] No username for gem award.");
                    return;
                }

                const res = await fetch("http://localhost:5000/api/gems/add", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username,
                        amount: gemsToAward,
                    }),
                });

                if (!res.ok) {
                    console.error(
                        "[SCREEN] Failed to award gems on level up:",
                        res.status,
                        res.statusText
                    );
                    return;
                }

                const data = await res.json().catch(() => ({}));
                console.log("[SCREEN] Gems awarded on level up:", data);

                const prevGems = Number(studentData.gems) || 0;
                setStudentData({
                    ...studentData,
                    gems: prevGems + gemsToAward,
                });
            } catch (err) {
                console.error("[SCREEN] Error awarding gems on level up:", err);
            }
        })();
    }, [studentData, lastLevel, setStudentData]);

    // Forces tournament to end early by changing its endTime to now + 10s
    async function forceEndTournament(tid) {
        if (!tid) return;
        const newEndTime = Date.now() + FORCE_END_IN_MS;

        // Call backend to change endTime
        try {
            const res = await fetch(
                "http://localhost:5000/api/tournament/change-endtime",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        tid,
                        newEndTime,
                    }),
                }
            );

            // Get data from endpoint
            const data = await res.json().catch(() => null);
            if (!res.ok || !data?.successful) {
                console.error(
                    "[NewTournamentScreen] forceEndTournament failed",
                    data
                );
            } else {
                console.log(
                    "[NewTournamentScreen] forceEndTournament succeeded for tid",
                    tid
                );
            }
        } catch (err) {
            console.error(
                "[NewTournamentScreen] Error in forceEndTournament:",
                err
            );
        }
    }

    // Reloads a tournament of a certain type from backend after force end
    async function reloadTournamentForType(tournamentType, currentTournament) {
        if (!major) return;

        let title;
        if (tournamentType === "daily") title = "Daily Tournament";
        else if (tournamentType === "weekly") title = "Weekly Tournament";
        else if (tournamentType === "ranked") title = "Ranked Tournament";
        else return;

        // Use current topics if we have them; if not, just send something.
        const topicsToSend = currentTournament?.topics || "General";

        const body = {
            title,
            topics: topicsToSend,
            reward: currentTournament?.reward ?? 150,
            tournamentType, // "daily" | "weekly" | "ranked"
            endTime: null, // let backend use stored or computed endDate
            startTime: Date.now(), // only used if it has to create a new one
            studentMajor: major,
        };

        try {
            const res = await fetch(
                "http://localhost:5000/api/create-tournament",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                }
            );

            const data = await res.json().catch(() => null);
            if (!res.ok || !data?.successful) {
                console.error(
                    `[NewTournamentScreen] reloadTournamentForType failed for ${tournamentType}`,
                    data
                );
                return;
            }

            const updatedTournament = {
                id: data.tid,
                title,
                topics: data.topics,
                endDateLabel: "",
                endTime: new Date(data.endDate).getTime(),
                reward: currentTournament?.reward ?? 150,
                isRanked: tournamentType === "ranked",
                tournamentType,
                startTime: new Date(data.startDate).getTime(),
            };

            if (tournamentType === "daily") {
                setDailyTournament([updatedTournament]);
            } else if (tournamentType === "weekly") {
                setWeeklyTournament([updatedTournament]);
            } else if (tournamentType === "ranked") {
                setRankedTournament([updatedTournament]);
            }

            console.log(
                `[NewTournamentScreen] Reloaded ${tournamentType} tournament from backend`,
                updatedTournament
            );
        } catch (err) {
            console.error(
                `[NewTournamentScreen] Error reloading ${tournamentType} tournament:`,
                err
            );
        }
    }

    // P key handler to end tournament early for testing
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key !== "p" && e.key !== "P") return;

            console.log("[Tournament] Forcing tournaments to end in 10s...");

            const activeDaily = false;
            const activeWeekly = false;

            //const activeDaily = dailyTournament[0];
            //const activeWeekly = weeklyTournament[0];
            const activeRanked = rankedTournament[0];

            (async () => {
                const ops = [];

                if (!dailyInBetween && activeDaily) {
                    ops.push(
                        (async () => {
                            await forceEndTournament(activeDaily.id);
                            await reloadTournamentForType("daily", activeDaily);
                        })()
                    );
                }
                if (!weeklyInBetween && activeWeekly) {
                    ops.push(
                        (async () => {
                            await forceEndTournament(activeWeekly.id);
                            await reloadTournamentForType(
                                "weekly",
                                activeWeekly
                            );
                        })()
                    );
                }
                if (!rankedInBetween && activeRanked?.id) {
                    ops.push(
                        (async () => {
                            await forceEndTournament(activeRanked.id);
                            await reloadTournamentForType(
                                "ranked",
                                activeRanked
                            );
                        })()
                    );
                }

                if (ops.length > 0) {
                    await Promise.all(ops);
                    console.log(
                        "[Tournament] Finished refreshing tournaments after force end"
                    );
                }
            })();
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        dailyTournament,
        weeklyTournament,
        rankedTournament,
        dailyInBetween,
        weeklyInBetween,
        rankedInBetween,
        major,
    ]);

    // Basic load student data on mount
    useEffect(() => {
        console.log(
            "[LOAD] [NewTournamentScreen] Loading basic student data on mount"
        );
        loadBasicStudentData();
        setMajor(studentData?.major);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Ensures topics exist for major on mount / major change
    useEffect(() => {
        async function ensureTopicsForMajor() {
            try {
                const res = await fetch(
                    "http://localhost:5000/api/tournament/generate-topics",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ major }),
                    }
                );

                // If we had to generate topics, create tournaments as well after
                if ((await res.json()).topicsGenerated) {
                    await createTournamentForType(major, "daily");
                    await createTournamentForType(major, "weekly");
                    await createTournamentForType(major, "ranked");
                }

                console.log(
                    "[NewTournamentScreen] Ensured topics for major:",
                    major
                );
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
            console.log("[NewTournamentScreen] [1] setting loading to true");
            setLoadingTournament(true);
            console.log(
                "Entering create tournament for tournament type ",
                tournamentType,
                " major ",
                majorParam,
                " isUpcoming = ",
                isUpcoming
            );

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

            // First make sure we have the students major
            if (!majorParam) {
                console.log(
                    "No major provided, can not create tournament of type",
                    tournamentType
                );
                return;
            }

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
                        studentMajor: major,
                    }),
                }
            );

            console.log("Response from create-tournament:", res);

            const data = await res.json().catch(() => null);

            if (!res.ok || !data?.successful) {
                console.error(
                    "Failed to create tournament of type " + tournamentType,
                    data
                );
                return;
            }

            const newTid = data.tid;
            const newTopics = data.topics;
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
                    console.log(
                        "[1] Setting up dailiy tournament to ",
                        newTournamentObj
                    );
                    setDailyTournament([newTournamentObj]);
                }
            } else if (tournamentType === "weekly") {
                if (isUpcoming) {
                    setWeeklyUpcomingTournament(newTournamentObj);
                } else {
                    console.log(
                        "[1] Setting up weekly tournament to ",
                        newTournamentObj
                    );
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
                console.log(
                    "[Ranked] Setting new ranked tournament's newTournament to",
                    isFinalRound
                );

                newTournamentObj.newTournament = isFinalRound;

                if (isUpcoming) {
                    setRankedUpcomingTournament(newTournamentObj);
                } else {
                    console.log(
                        "[1] Setting up ranked tournament to ",
                        rankedTournament
                    );
                    setRankedTournament([newTournamentObj]);
                }
            }
        } catch (err) {
            console.error("Error creating tournament:", err);
        } finally {
            setLoadingTournament(false);
        }
    }

    // On mount, load current tournaments or create new ones, as long as we are not in between phase
    useEffect(() => {
        async function loadOrCreate() {
            try {
                if (!dailyInBetween) {
                    await createTournamentForType(major, "daily");
                }
                if (!weeklyInBetween) {
                    await createTournamentForType(major, "weekly");
                }
                if (!rankedInBetween) {
                    await createTournamentForType(major, "ranked");
                }
            } catch (e) {
                console.log("Failed to create tournaments. Error:", e);
            }
        }

        if (major) {
            loadOrCreate();
        }
    }, [major, dailyInBetween, weeklyInBetween, rankedInBetween]);

    // Timer to rotate tournaments out when their endTime passes
    useEffect(() => {
        const tick = async () => {
            const now = Date.now();

            const daily = dailyTournament[0];
            const weekly = weeklyTournament[0];
            const ranked = rankedTournament[0];

            // DAILY tournament check
            if (daily) {
                // In between phase
                if (dailyInBetween) {
                    // Make sure we have an upcoming tournament
                    if (dailyUpcomingTournament) {
                        // Update remaining time
                        setDailyRemainingTime(
                            dailyUpcomingTournament.startTime - now
                        );

                        // Time to start next tournament
                        if (now >= dailyUpcomingTournament.startTime) {
                            console.log(
                                "[NewTournamentScreen] Ending DAILY in-between state"
                            );
                            setDailyInBetween(false);
                            setDailyTournament([dailyUpcomingTournament]);
                            setDailyUpcomingTournament(null);
                        }
                    } else {
                        console.warn(
                            "[NewTournamentScreen] In DAILY in-between phase but no upcoming tournament found."
                        );
                    }
                }
                // Active tournament ended
                else if (daily.id && daily.endTime && now >= daily.endTime) {
                    console.log(
                        "[NewTournamentScreen] DAILY tournament ended, starting student data refresh burst"
                    );
                    // 🔹 start 5-second burst of student data reloads
                    startStudentDataRefreshBurst();

                    // Go to in-between phase
                    setDailyInBetween(true);

                    const nextStartTime = now + betweenTournamentTime;

                    // Create next tournament as upcoming
                    await createTournamentForType(
                        major,
                        "daily",
                        nextStartTime,
                        true // isUpcoming
                    );
                }
                // Tournament still active
                else if (daily.endTime) {
                    // Update remaining time
                    setDailyRemainingTime(daily.endTime - now);
                }
            }

            // WEEKLY tournament check
            if (weekly) {
                // In between phase
                if (weeklyInBetween) {
                    // Make sure we have an upcoming tournament
                    if (weeklyUpcomingTournament) {
                        // Update remaining time
                        setWeeklyRemainingTime(
                            weeklyUpcomingTournament.startTime - now
                        );

                        // Time to start next tournament
                        if (now >= weeklyUpcomingTournament.startTime) {
                            console.log(
                                "[NewTournamentScreen] Ending WEEKLY in-between state"
                            );
                            setWeeklyInBetween(false);
                            setWeeklyTournament([weeklyUpcomingTournament]);
                            setWeeklyUpcomingTournament(null);
                        }
                    } else {
                        console.warn(
                            "[NewTournamentScreen] In WEEKLY in-between phase but no upcoming tournament found."
                        );
                    }
                }
                // Active tournament ended
                else if (weekly.id && weekly.endTime && now >= weekly.endTime) {
                    console.log(
                        "[NewTournamentScreen] WEEKLY tournament ended, starting student data refresh burst"
                    );
                    // 🔹 start 5-second burst of student data reloads
                    startStudentDataRefreshBurst();

                    // Go to in-between phase
                    setWeeklyInBetween(true);

                    const nextStartTime = now + betweenTournamentTime;

                    // Create next tournament as upcoming
                    await createTournamentForType(
                        major,
                        "weekly",
                        nextStartTime,
                        true // isUpcoming
                    );
                }
                // Tournament still active
                else if (weekly.endTime) {
                    // Update remaining time
                    setWeeklyRemainingTime(weekly.endTime - now);
                }
            }

            // RANKED tournament check
            if (ranked) {
                // In between phase
                if (rankedInBetween) {
                    // Make sure we have an upcoming tournament
                    if (rankedUpcomingTournament) {
                        // Update remaining time
                        setRankedRemainingTime(
                            rankedUpcomingTournament.startTime - now
                        );

                        // Time to start next tournament (or next bracket round)
                        if (now >= rankedUpcomingTournament.startTime) {
                            console.log(
                                "[NewTournamentScreen] Ending RANKED in-between state"
                            );
                            setRankedInBetween(false);
                            setRankedTournament([rankedUpcomingTournament]);
                            setRankedUpcomingTournament(null);
                        }
                    } else {
                        console.warn(
                            "[NewTournamentScreen] In RANKED in-between phase but no upcoming tournament found."
                        );
                    }
                }
                // Active tournament ended
                else if (ranked.id && ranked.endTime && now >= ranked.endTime) {
                    console.log(
                        "[NewTournamentScreen] RANKED tournament ended, starting student data refresh burst"
                    );
                    // 🔹 start 5-second burst of student data reloads
                    startStudentDataRefreshBurst();

                    // Go to in-between phase
                    setRankedInBetween(true);

                    const nextStartTime = now + betweenTournamentTime;

                    // Create next tournament (or next bracket round) as upcoming
                    await createTournamentForType(
                        major,
                        "ranked",
                        nextStartTime,
                        true // isUpcoming
                    );
                }
                // Tournament still active
                else if (ranked.endTime) {
                    // Update remaining time
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
        loadBasicStudentData,
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
            <MainPopup
                open={showLevelUpPopup}
                title="Congrats, you leveled up!"
                type="levelUp"
                onClose={() => setShowLevelUpPopup(false)}
            >
                <p className="mainPopup-message">
                    You earned{" "}
                    <span className="levelUpGems">
                        {levelUpGemsAwarded} <Gem className="levelUpGemIcon" />
                    </span>{" "}
                    for reaching Level {justLeveledTo}.
                </p>
            </MainPopup>
            <ScreenScroll ref={scrollerRef}>
                <PullToRefresh scrollerRef={scrollerRef} onRefresh={refresh}>
                    <Container className="mainContainer">
                        {/* Progress bar */}
                        <XpHeaderBar />

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
