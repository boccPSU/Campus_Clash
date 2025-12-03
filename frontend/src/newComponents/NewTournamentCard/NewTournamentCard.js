import { useState, useEffect } from "react";
import Spinner from "react-bootstrap/Spinner";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import InfoTile from "../InfoTile/InfoTile";
import { ChevronDown, ChevronUp, Check, X } from "react-bootstrap-icons";

// Const values
const LEADERBOARD_PREVIEW_COUNT = 3; // How many users on leaderboard are shown before expanding

// Helper function to compute how many players advance in ranked tournaments
function computeKeepCount(total) {
    if (total <= 3) return 0; // NOTE: we will override this for active tournaments with < 4 players
    if (total === 4) return 3;
    if (total % 2 === 0) return total / 2;
    return Math.ceil(total / 2);
}

// Display and join component for a tournament
function NewTournamentCard({
    tid,
    title,
    topics,
    reward,
    isRanked = false,
    tournamentType = "daily", // (daily, weekly, ranked)
    remainingTime = 0,
    tournamentOver = false,
    newTournament = false, // ranked only: true if this finished tournament is the FINAL one (no more rounds)
}) {
    const navigate = useNavigate();

    // Display state derived from tournamentType
    const [difficulty, setDifficulty] = useState("Easy");
    const [xp, setXp] = useState(200); // Easy 200xp, medium 300xp, hard 400xp

    // Leaderboard expand/collapse
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    // Join-availability + join-in-progress
    const [canJoin, setCanJoin] = useState(true);
    const [joining, setJoining] = useState(false);

    // Leaderboard data from backend: [{ username, score }, ...]
    const [leaderboard, setLeaderboard] = useState([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);

    // Set difficulty + XP based on tournamentType
    useEffect(() => {
        if (tournamentType === "weekly") {
            setDifficulty("Medium");
            setXp(300);
        } else if (tournamentType === "ranked") {
            setDifficulty("Hard");
            setXp(400);
        } else {
            setDifficulty("Easy");
            setXp(200);
        }
    }, [tournamentType]);

    // Load leaderboard + check if user already joined (once tid is known)
    useEffect(() => {
        async function initForTid() {
            // If tournament is already over, don't allow joining
            if (tournamentOver) {
                //console.log("[NewTournamentCard] Tournament is over, disabling join for",title);
                setCanJoin(false);
            } else {
                //console.log("[NewTournamentCard] Tournament not over, enabling join for",title);
                setCanJoin(true);
            }

            if (!tid) {
                //console.log("[NewTournamentCard] No tid yet for",title,"skipping leaderboard/join check");
                return;
            }

            // Check if user is already in tournament
            const tokenString = localStorage.getItem("token");
            if (!tokenString) {
                //console.log("[NewTournamentCard] No token, disabling join button");
                setCanJoin(false);
            } else {
                let tokenValue = "";
                try {
                    const parsed = JSON.parse(tokenString);
                    tokenValue = parsed.token || tokenString;
                } catch {
                    tokenValue = tokenString;
                }

                try {
                    const resHasJoined = await fetch(
                        "http://localhost:5000/api/tournament/has-joined",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "jwt-token": tokenValue,
                            },
                            body: JSON.stringify({ tid }),
                        }
                    );

                    const hasJoined = await resHasJoined
                        .json()
                        .catch(() => false);

                    if (hasJoined) {
                        //console.log(
                        //    "[NewTournamentCard] User already joined tid =",
                        //    tid
                        //);
                        setCanJoin(false);
                    }
                } catch (e) {
                        //console.log(
                        //"[NewTournamentCard] Failed has-joined check. Error:",
                        //e
                    //);
                }
            }

            // Load leaderboard for this tid
            try {
                setLeaderboardLoading(true);

                const res = await fetch(
                    "http://localhost:5000/api/tournament/participating-users-info",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ tid }),
                    }
                );

                const data = await res.json().catch(() => null);

                if (!res.ok || !data?.successful) {
                    //console.log(
                    //    "[NewTournamentCard] Leaderboard failed to load for tid=",
                    //    tid
                    //);
                    return;
                }

                //console.log(
                //    "[NewTournamentCard] Leaderboard data for tid=",
                //    tid,
                //    data
                //);
                setLeaderboard(data.participants || []);
            } catch (e) {
                //console.log("[NewTournamentCard] Failed to fetch leaderboard. Error:",
                //    e
                //);
            } finally {
                setLeaderboardLoading(false);
            }
        }

        initForTid();
    }, [tid, title, tournamentOver]);

    // Visible leaderboard depending on expanded/collapsed
    const visibleLeaderboard = showLeaderboard
        ? leaderboard
        : leaderboard.slice(0, LEADERBOARD_PREVIEW_COUNT);

    // How many players advance, based on full leaderboard length
    const totalParticipants = leaderboard.length;
    const baseKeepCount = computeKeepCount(totalParticipants);

    // FINAL ranked tournament? (tournament ended, ranked, flagged as final)
    const isFinalRankedTournament =
        isRanked && tournamentOver && newTournament;

    
    let keepCountForStatus = 0;

    if (isRanked) {
        if (isFinalRankedTournament) {
            // Final tournament: winners are top 3 (or fewer if <3 players)
            keepCountForStatus = Math.min(3, totalParticipants);
        } else if (tournamentOver) {
            // Round over, not final
            keepCountForStatus =
                baseKeepCount === 0 && totalParticipants > 0
                    ? totalParticipants // safety net
                    : baseKeepCount;
        } else {
            // Active ranked tournament
            if (totalParticipants > 0 && totalParticipants <= 3) {
                // Under 4 people: everyone currently in is "advancing"
                keepCountForStatus = totalParticipants;
            } else {
                keepCountForStatus = baseKeepCount;
            }
        }
    }

    // Decide leaderboard title text
    let leaderboardTitle = "";
    if (tournamentOver) {
        if (isRanked) {
            // Ranked & over: final vs round
            leaderboardTitle = newTournament
                ? "Tournament Over – Winners"
                : "Round Over – Advancing Players";
        } else {
            // Non-ranked & over
            leaderboardTitle = "Tournament Over – Winners";
        }
    } else {
        leaderboardTitle = isRanked ? "Ranked Leaderboard" : "Leaderboard";
    }

    // Handle joining a tournament
    const handleJoin = async () => {
        if (!tid) {
            //console.log(
            //    "[NewTournamentCard] Tried to join but no tid present for",
            //    title
            //);
            return;
        }

        // Don't allow joining if tournament logically over
        if (tournamentOver) {
            //console.log(
            //    "[NewTournamentCard] Tournament is over, cannot join:",
            //    tid
            //);
            setCanJoin(false);
            return;
        }

        // Get user's token
        const tokenString = localStorage.getItem("token");
        if (!tokenString) {
            //console.log("[NewTournamentCard] No token, cannot join tournament");
            setCanJoin(false);
            return;
        }

        let tokenValue = "";
        try {
            const parsed = JSON.parse(tokenString);
            tokenValue = parsed.token || tokenString;
        } catch {
            tokenValue = tokenString;
        }

        try {
            setJoining(true);

            const res = await fetch(
                "http://localhost:5000/api/join-tournament",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "jwt-token": tokenValue,
                    },
                    body: JSON.stringify({ tid }),
                }
            );

            //console.log("[NewTournamentCard] joining tournament " + tid);

            if (!res.ok) {
                console.error(
                    "[NewTournamentCard] join-tournament failed:",
                    await res.json().catch(() => ({}))
                );
                alert(
                    "Unable to join tournament right now. Please try again later."
                );
                setCanJoin(false);
                return;
            }

            const joined = await res.json(); // true if newly joined, false if already joined

            if (!joined) {
                setCanJoin(false);
                return;
            }

            // Successfully joined, go to questions screen
            navigate("/questions", {
                state: {
                    title,
                    tournamentId: tid,
                    tournamentType,
                    isRanked,
                },
            });
        } catch (err) {
            console.error("[NewTournamentCard] Error joining tournament:", err);
            setCanJoin(false);
        } finally {
            setJoining(false);
        }
    };

    return (
        <InfoTile title={title}>
            <div className="infoContainer">
                {/* Tournament topics */}
                <div className="tournamentInfo">
                    <span className="tLabel">Topics: </span>
                    <span className="tournamentTopics">
                        {" "}
                        {topics || "Loading..."}{" "}
                    </span>
                </div>

                {/* Difficulty + XP row */}
                <div className="tournamentXp">
                    <span className="tournamentXpItem">
                        <span className="tLabel">Difficulty: {difficulty}</span>
                    </span>
                    <span className="tournamentXpItem">
                        <span className="tLabel">XP Reward: {xp} XP</span>
                    </span>
                </div>
            </div>

            {/* Leaderboard */}
            <div className="leaderboard">
                <h3 className="leaderboardTitle">{leaderboardTitle}</h3>

                {leaderboardLoading ? (
                    <div className="leaderboardLoading">
                        <Spinner
                            animation="border"
                            size="sm"
                            className="me-2"
                        />
                        <span>Loading leaderboard…</span>
                    </div>
                ) : leaderboard && leaderboard.length === 0 ? (
                    <p>No participants yet</p>
                ) : (
                    <>
                        <div className="leaderboardBody">
                            {/* Column labels */}
                            <div className="leaderboardRow leaderboardHeaderRow">
                                <span className="leaderboardPlace">Place</span>
                                <span className="leaderboardName">
                                    Username
                                </span>
                                <span className="leaderboardScore">Score</span>
                                {isRanked && (
                                    <span className="leaderboardStatus">
                                        Advancing
                                    </span>
                                )}
                            </div>

                            {/* Data rows from real leaderboard state */}
                            {visibleLeaderboard.map((entry, index) => (
                                <div
                                    key={entry.username || index}
                                    className="leaderboardRow"
                                >
                                    <span className="leaderboardPlace">
                                        #{index + 1}
                                    </span>
                                    <span className="leaderboardName">
                                        {entry.username}
                                    </span>
                                    <span className="leaderboardScore">
                                        {entry.score}
                                    </span>

                                    {isRanked && (
                                        <span className="leaderboardStatus">
                                            {index < keepCountForStatus ? (
                                                <Check className="rankedCheck" />
                                            ) : (
                                                <X className="rankedX" />
                                            )}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {leaderboard &&
                            leaderboard.length >
                                LEADERBOARD_PREVIEW_COUNT && (
                                <button
                                    type="button"
                                    className="leaderboardToggle"
                                    onClick={() =>
                                        setShowLeaderboard((prev) => !prev)
                                    }
                                    aria-label={
                                        showLeaderboard
                                            ? "Show fewer leaderboard entries"
                                            : "Show full leaderboard"
                                    }
                                >
                                    {showLeaderboard ? (
                                        <ChevronUp />
                                    ) : (
                                        <ChevronDown />
                                    )}
                                </button>
                            )}
                    </>
                )}
            </div>

            {/* Join button below the leaderboard, only rendered if canJoin is true AND tournament isn't over */}
            {canJoin && !tournamentOver && (
                <div className="btnGroup">
                    <Button
                        variant="primary"
                        className="joinBtn"
                        onClick={handleJoin}
                        disabled={joining || !tid}
                    >
                        {joining ? (
                            <>
                                <Spinner
                                    animation="border"
                                    role="status"
                                    size="sm"
                                    className="me-2"
                                >
                                    <span className="visually-hidden">
                                        Joining...
                                    </span>
                                </Spinner>
                                Joining…
                            </>
                        ) : (
                            "Join"
                        )}
                    </Button>
                </div>
            )}
        </InfoTile>
    );
}

export default NewTournamentCard;
