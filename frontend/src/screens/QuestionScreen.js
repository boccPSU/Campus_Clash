// Displays tournament game

import React, { useRef, useState, useEffect } from "react";
import InfoBox from "../components/InfoBox/InfoBox";
import BottomNav from "../components/BottomNav/BottomNav.js";
import HeaderBar from "../components/HeaderBar/HeaderBar.js";
import useCollapseOnScroll from "../components/hooks/useCollapseOnScroll.js";
import PullToRefresh from "../components/interaction/PullToRefresh.js";
import ScreenScroll from "../components/ScreenScroll/ScreenScroll.js";
import { Button } from "react-bootstrap";
import { useLocation } from "react-router-dom";

export default function QuestionScreen() {
    // Used to get data from navigate() function
    const location = useLocation();
    const navState = location.state || {};
    const navTitle = navState.title; // Tournament title used to fetch its questions

    // -----------------------------
    // Default values / constants
    // -----------------------------
    //const DEFAULT_CATEGORY = "Computer Science";
    //const DEFAULT_DIFFICULTY = "medium";
    //const QUESTION_COUNT = 5; // Not strictly used here, but describes expected # of questions

    // Timing configuration (shared by all players)
    // Every player uses the same schedule relative to the tournament's startTime.
    // The "tournamentStartTime" is: startTime + PREP_DURATION_MS
    const PREP_DURATION_MS = 15_000;          // Time from startTime until first question
    const QUESTION_DURATION_MS = 15_000;      // Duration of each question
    const LEADERBOARD_DURATION_MS = 5_000;    // Leaderboard time between questions
    const CYCLE_DURATION_MS =
        QUESTION_DURATION_MS + LEADERBOARD_DURATION_MS; // One full question + leaderboard cycle

    // -----------------------------
    // State variables
    // -----------------------------

    // Which "screen" is currently active:
    //  - "waiting": before first question / during prep or between questions
    //  - "question": actively answering a question
    //  - "leaderboard": showing score and waiting for next question or end
    const [stage, setStage] = useState("waiting");

    // Whether this client is participating in the tournament
    const [inProgress, setInProgress] = useState(false);

    // The full list of questions for this tournament and the current index
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Answer selection and scoring for this player
    const [selectedIndex, setSelectedIndex] = useState(null); // Which answer the player clicked
    const [isCorrect, setIsCorrect] = useState(null);         // true/false/null (null = not answered yet)
    const [score, setScore] = useState(0);                    // Player's score across questions

    // Loading / error state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Tournament data from backend
    const [startTime, setStartTime] = useState(null); // ms timestamp
    const [topics, setTopics] = useState();
    const [difficulty, setDifficulty] = useState();

    // Header UI 
    const currentXP = 10500;
    const scrollerRef = useRef(null);
    const collapsed = useCollapseOnScroll(scrollerRef);

    // Loads questions by tournament title
    const loadQuestions = async () => {
        if (!navTitle) {
            setError("Missing tournament title from navigation.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const res = await fetch(
                `http://localhost:5000/api/tournament/questions/${encodeURIComponent(
                    navTitle
                )}`
            );

            if (!res.ok) {
                throw new Error(`Failed to load questions (${res.status})`);
            }

            const data = await res.json();
            console.log("Questions API response:", data);

            const loadedQuestions = data.questions || [];

            if (!Array.isArray(loadedQuestions)) {
                throw new Error("Invalid questions format from API");
            }

            // Store questions array in state
            setQuestions(loadedQuestions);


            setStage("waiting");
        } catch (err) {
            console.error(err);
            setError(err.message || "Unable to load questions");
        } finally {
            setLoading(false);
        }
    };

    // Used by PullToRefresh to reload questions from the server
    const refresh = async () => {
        await loadQuestions();
    };

  
    // Sync player with tournament timing, does not allow player to join if tournament started
    const syncPlayer = (startTimeMs) => {
        const tournamentStartMs = startTimeMs + PREP_DURATION_MS;
        const now = Date.now();

        if (now > tournamentStartMs) {
            console.log("Tournament already started for this user.");
            setError("This tournament has already started. Please join the next one.");
            // We do not call setStartTime in this case, so the timer effect never runs.
            return false;
        }

        return true;
    };

    // -----------------------------
    // Initial tournament join + metadata load
    // -----------------------------
    // When the user navigates to this screen:
    //  1. Join the current tournament (based on JWT token).
    //  2. Fetch /api/current-tournament to get topics, difficulty, startTime.
    //  3. Call syncPlayer(startTimeMs) to see if they arrived too late.
    //  4. If not too late, set startTime so the timer effect can drive the stages.
    const initTournament = async () => {
        console.log(
            "Initializing tournament... token is " + sessionStorage.getItem("token")
        );
        setError("");

        // Get user token from sessionStorage (set during login/register)
        const tokenString = sessionStorage.getItem("token");
        if (!tokenString) {
            setError("No token found in session. Please log in again.");
            return;
        }

        let tokenValue = "";
        try {
            const userToken = JSON.parse(tokenString);
            tokenValue = userToken.token;
        } catch {
            setError("Invalid token format. Please log in again.");
            return;
        }

        console.log("User token in initTournament:", tokenValue);

        try {
            // Mark as in-progress locally (we can still later mark it false if needed)
            setInProgress(true);

            // 1) Join the tournament for this user
            await fetch("http://localhost:5000/api/join-tournament", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "jwt-token": tokenValue,
                },
            });

            // 2) Fetch tournament metadata (topics, difficulty, startTime, etc.)
            const res = await fetch(
                "http://localhost:5000/api/current-tournament",
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "jwt-token": tokenValue,
                    },
                }
            );

            if (!res.ok) {
                throw new Error(`Failed to load tournament (${res.status})`);
            }

            const data = await res.json();
            const t = data.tournament;

            if (!t) {
                throw new Error("Invalid tournament format from API");
            }

            // Use server-provided metadata if present
            if (t.topics) setTopics(t.topics);
            if (t.difficulty) setDifficulty(t.difficulty);

            // Determine the tournament's official startTime in ms
            // If missing, use "now" as a fallback (local-only run)
            let startTimeMs;
            if (t.startTime) {
                startTimeMs = new Date(t.startTime).getTime();
            } else {
                startTimeMs = Date.now();
            }

            // 3) Check if the tournament already started past the prep window
            const okToJoin = syncPlayer(startTimeMs);
            if (!okToJoin) {
                // Tournament started; do not start timer for this user.
                setInProgress(false);
                return;
            }

            // 4) If it's not too late, set startTime so the timer can drive the stages.
            setStartTime(startTimeMs);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to initialize tournament");
            setInProgress(false);
        }
    };

    // -----------------------------
    // Answer selection
    // -----------------------------
    const handleAnswer = (index) => {
        // Do not allow multiple answers or answering outside of "question" stage
        if (selectedIndex !== null) return;
        if (stage !== "question") return;

        const q = questions[currentIndex];
        if (!q) return;

        const correct = index === q.correctIndex;

        setSelectedIndex(index);
        setIsCorrect(correct);

        if (correct) {
            // Simple scoring: +100 points for each correct answer
            // (Can later be modified for time-based scoring, streaks, etc.)
            setScore((prev) => prev + 100);
        }
    };

    // Manual "Next Question" button (mainly useful for debugging without timing loop)
    const handleNextQuestion = () => {
        const next = currentIndex + 1;
        if (next >= questions.length) {
            // No more questions: could transition to a final game-over screen here
            return;
        }

        setCurrentIndex(next);
        setSelectedIndex(null);
        setIsCorrect(null);
        setStage("question");
    };

    // -----------------------------
    // Initial load on mount
    // -----------------------------
    useEffect(() => {
        // On load, load questions and initialize the tournament
        loadQuestions();
        initTournament();
    }, []);

    // -----------------------------
    // Tournament timing loop
    // -----------------------------
    // This effect:
    //  - Depends on startTime and questions.length
    //  - On each tick (every 300 ms), computes how far we are from startTime
    //  - Chooses correct stage: "waiting", "question", or "leaderboard"
    //  - Computes which question index (qIndex) should be active
    //
    // Note:
    //  - The actual "tournamentStartTime" is startTime + PREP_DURATION_MS.
    //  - Before that, stage remains "waiting".
    useEffect(() => {
        // If we don't have a startTime or no questions yet, don't start the timer
        if (!startTime || questions.length === 0) return;

        const timer = setInterval(() => {
            const now = Date.now();
            const diff = now - startTime; // ms since official startTime

            if (diff < 0) {
                // Before the official startTime
                setStage("waiting");
                return;
            }

            if (diff < PREP_DURATION_MS) {
                // Prep window: give everyone time to load and get ready
                // Tournament has not "started" yet on the frontend.
                setStage("waiting");
                return;
            }

            // Time elapsed since prep ended
            const sincePrep = diff - PREP_DURATION_MS;

            // Integer question index based on which cycle we're in
            const qIndex = Math.floor(sincePrep / CYCLE_DURATION_MS);

            if (qIndex >= questions.length) {
                // All questions done → final leaderboard
                setStage("leaderboard");
                setInProgress(false);
                clearInterval(timer);
                return;
            }

            // Position within the current question+leaderboard cycle
            const withinCycle = sincePrep % CYCLE_DURATION_MS;

            if (withinCycle < QUESTION_DURATION_MS) {
                // We are in the "question answering" phase
                if (stage !== "question" || currentIndex !== qIndex) {
                    setStage("question");
                    setCurrentIndex(qIndex);
                    setSelectedIndex(null);
                    setIsCorrect(null);
                }
            } else {
                // We are in the leaderboard phase between questions
                if (stage !== "leaderboard" || currentIndex !== qIndex) {
                    setStage("leaderboard");
                }
            }
        }, 300); // Tick every 0.3s

        return () => clearInterval(timer);
        // We intentionally omit 'stage' and 'currentIndex' from deps
        // to avoid resetting the timer too often.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startTime, questions.length]);

    // -----------------------------
    // Render helpers
    // -----------------------------

    // Waiting screen (before tournament starts or during prep period)
    const renderWaiting = () => (
        <InfoBox title="Tournament">
            {loading && <p>Loading questions...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {!loading && !error && (
                <>
                    <p>Waiting to start...</p>
                    <p>
                        Category: <strong>{topics}</strong> | Difficulty:{" "}
                        <strong>{difficulty}</strong>
                    </p>
                    <p>
                        Questions loaded: <strong>{questions.length}</strong>
                    </p>
                    {/* No "Start" button:
                        The tournament will automatically start for all users
                        once (now >= startTime + PREP_DURATION_MS). */}
                </>
            )}
        </InfoBox>
    );

    // Question screen for the current question index
    const renderQuestion = () => {
        const q = questions[currentIndex];

        if (!q) {
            console.log("No questions, returning null");
            return null;
        }

        return (
            <InfoBox
                title={`Question ${currentIndex + 1} of ${questions.length}`}
            >
                <div className="QuestionCategory">
                    <h6>
                        {q.category} • {q.difficulty}
                    </h6>
                </div>

                <div className="QuestionText" style={{ margin: "12px 0" }}>
                    <h4>{q.question}</h4>
                </div>

                <div className="Answers" style={{ display: "grid", gap: 8 }}>
                    {q.options.map((opt, idx) => {
                        const isSelected = idx === selectedIndex;
                        const isCorrectOpt = idx === q.correctIndex;

                        // Basic feedback styling:
                        //  - Green: correct answer
                        //  - Red: selected but wrong
                        //  - Grey outline: untouched
                        let variant = "outline-secondary";
                        if (selectedIndex !== null) {
                            if (isCorrectOpt) variant = "success";
                            else if (isSelected) variant = "danger";
                        }

                        return (
                            <Button
                                key={idx}
                                variant={variant}
                                onClick={() => handleAnswer(idx)}
                                disabled={selectedIndex !== null}
                            >
                                {opt}
                            </Button>
                        );
                    })}
                </div>

                <div style={{ marginTop: 12 }}>
                    <p>
                        Your score: <strong>{score}</strong>
                    </p>
                    {isCorrect !== null && (
                        <p>
                            You were{" "}
                            <strong>
                                {isCorrect ? "correct" : "incorrect"}
                            </strong>
                            .
                        </p>
                    )}
                </div>
            </InfoBox>
        );
    };

    // Leaderboard stage shown between questions (or at the very end)
    const renderLeaderboard = () => (
        <InfoBox title="Leaderboard">
            {/* For now, this only shows the local player's score.
                Later, you can extend this to show all participants
                by having the backend track scores. */}
            <p>
                Your score: <strong>{score}</strong>
            </p>
            <p>
                Current question: {Math.min(currentIndex + 1, questions.length)}{" "}
                / {questions.length}
            </p>

            {/* Debug/manual navigation without timing loop */}
            {!inProgress && currentIndex + 1 < questions.length && (
                <Button variant="primary" onClick={handleNextQuestion}>
                    Next Question
                </Button>
            )}

            {!inProgress && (
                <Button
                    variant="outline-secondary"
                    onClick={loadQuestions}
                    style={{ marginLeft: 8 }}
                >
                    New Round
                </Button>
            )}

            {inProgress && <p>Waiting for next question...</p>}
        </InfoBox>
    );

    // -----------------------------
    // Main render
    // -----------------------------
    return (
        <>
            {/* Top navigation header */}
            <HeaderBar
                title="Tournaments"
                xp={currentXP}
                collapsed={collapsed}
            />

            {/* Spacer to push content below the header when fixed */}
            <div
                className={`headerSpacer ${collapsed ? "is-collapsed" : ""}`}
            />

            {/* Scrollable content area with pull-to-refresh */}
            <ScreenScroll ref={scrollerRef}>
                <PullToRefresh scrollerRef={scrollerRef} onRefresh={refresh}>
                    {stage === "waiting" && renderWaiting()}
                    {stage === "question" && renderQuestion()}
                    {stage === "leaderboard" && renderLeaderboard()}
                </PullToRefresh>

                {/* Extra space at bottom for the fixed bottom nav */}
                <div style={{ height: "var(--bottom-nav-height, 72px)" }} />
            </ScreenScroll>

            {/* Persistent bottom navigation bar */}
            <BottomNav />
        </>
    );
}
