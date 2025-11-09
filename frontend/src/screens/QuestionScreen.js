// Screen to display a question during the tournament

import React, { useRef, useState, useEffect } from "react";
import InfoBox from "../components/InfoBox/InfoBox";
import BottomNav from "../components/BottomNav/BottomNav.js";
import HeaderBar from "../components/HeaderBar/HeaderBar.js";
import useCollapseOnScroll from "../components/hooks/useCollapseOnScroll.js";
import PullToRefresh from "../components/interaction/PullToRefresh.js";
import ScreenScroll from "../components/ScreenScroll/ScreenScroll.js";
import { Button } from "react-bootstrap";

export default function QuestionScreen() {
    // Set these later
    const DEFAULT_CATEGORY = "Computer Science";
    const DEFAULT_DIFFICULTY = "medium";
    const QUESTION_COUNT = 5;

    // Timing configuration (shared by all players)
    // Each player uses the same schedule relative to tournament startTime
    const PREP_DURATION_MS = 5_000; // 1 min after startTime before first question
    const QUESTION_DURATION_MS = 15_000; // 15s each question
    const LEADERBOARD_DURATION_MS = 5_000; // 5s leaderboard between questions
    const CYCLE_DURATION_MS = QUESTION_DURATION_MS + LEADERBOARD_DURATION_MS;

    // State Vars

    // Different stages: "waiting", "question", "leaderboard"
    const [stage, setStage] = useState("waiting");

    // Indicates if a tournament is in progress so a new one can't start locally
    const [inProgress, setInProgress] = useState(false);

    // Questions from the backend along with the current question index
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Answer and score per player
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null); // true/false/null
    const [score, setScore] = useState(0);

    // Loading / error
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Tournament metadata from backend
    const [startTime, setStartTime] = useState(null); // ms from Date
    const [topics, setTopics] = useState(DEFAULT_CATEGORY);
    const [difficulty, setDifficulty] = useState(DEFAULT_DIFFICULTY);

    // header UX
    const currentXP = 10500;
    const scrollerRef = useRef(null);
    const collapsed = useCollapseOnScroll(scrollerRef);

    //------------------
    // Helper Functions
    //------------------

    // Get questions from backend API
    const loadQuestions = async () => {
        try {
            setLoading(true);
            setError("");

            // Hitting local dev server
            const res = await fetch(
                "http://localhost:5000/api/generate-questions",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        category: DEFAULT_CATEGORY,
                        difficulty: DEFAULT_DIFFICULTY,
                        count: QUESTION_COUNT,
                    }),
                }
            );

            if (!res.ok) {
                throw new Error(`Failed to load questions (${res.status})`);
            }

            // Get questions back from API
            const data = await res.json();

            if (!data.questions || !Array.isArray(data.questions)) {
                throw new Error("Invalid questions format from API");
            }

            // Set all state vars for a new round (questions only)
            setQuestions(data.questions);
            setCurrentIndex(0);
            setSelectedIndex(null);
            setIsCorrect(null);
            setScore(0);
            // Actual stage is controlled by tournament timing; default to waiting
            setStage("waiting");
        } catch (err) {
            console.error(err);
            setError(err.message || "Unable to load questions");
        } finally {
            setLoading(false);
        }
    };

    // For pull-to-refresh
    const refresh = async () => {
        await loadQuestions();
    };

    // Start the tournament:
    // - Fetch current tournament from backend
    // - Set topics, difficulty, startTime (shared across players)
    // - Ensure we have questions loaded
    const handleStart = async () => {
        console.log(
            "Starting tournament... token is " + localStorage.getItem("token")
        );
        setError("");

        //Get user token
        const tokenString = localStorage.getItem("token");
        const userToken = JSON.parse(tokenString);
        const tokenValue = userToken.token;
        console.log("User token in handleStart: " + tokenValue);
        try {
            setInProgress(true);

            // Join the tournament (id inferred on backend)
            await fetch("http://localhost:5000/api/join-tournament", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "jwt-token": tokenValue,
                },
            });

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

            // Store startTime as ms; if missing, fall back to now
            if (t.startTime) {
                setStartTime(new Date(t.startTime).getTime());
            } else {
                setStartTime(Date.now());
            }

            // Ensure we have questions loaded
            if (questions.length === 0) {
                await loadQuestions();
            }
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to start tournament");
            setInProgress(false);
        }
    };

    // Handle answer click
    // NOTE: We no longer drive stage changes here. The timing loop
    // decides when to switch to leaderboard so all players stay in sync.
    const handleAnswer = (index) => {
        if (selectedIndex !== null) return; // already answered
        if (stage !== "question") return; // only answer during question window

        const q = questions[currentIndex];
        if (!q) return;

        const correct = index === q.correctIndex;

        setSelectedIndex(index);
        setIsCorrect(correct);

        if (correct) {
            // Set score, make this more complex later (time-based)
            setScore((prev) => prev + 100);
        }
    };

    // Go to next question manually (used only if not relying on synced timing)
    // Leaving this here for debug/manual control if needed.
    const handleNextQuestion = () => {
        const next = currentIndex + 1;
        if (next >= questions.length) {
            // No more questions, go to game end state
            return;
        }

        setCurrentIndex(next);
        setSelectedIndex(null);
        setIsCorrect(null);
        setStage("question");
    };

    // initial load on question screen mount
    useEffect(() => {
        loadQuestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Tournament timing loop:
    // Uses shared startTime + fixed durations to keep all players in sync.
    useEffect(() => {
        if (!startTime || questions.length === 0) return;

        const timer = setInterval(() => {
            const now = Date.now();
            const diff = now - startTime; // ms since official startTime

            if (diff < 0) {
                // Before official startTime
                setStage("waiting");
                return;
            }

            if (diff < PREP_DURATION_MS) {
                // Prep window so all clients are ready
                setStage("waiting");
                return;
            }

            const sincePrep = diff - PREP_DURATION_MS;
            const qIndex = Math.floor(sincePrep / CYCLE_DURATION_MS);

            if (qIndex >= questions.length) {
                // Tournament over: final leaderboard
                setStage("leaderboard");
                setInProgress(false);
                clearInterval(timer);
                return;
            }

            const withinCycle = sincePrep % CYCLE_DURATION_MS;

            if (withinCycle < QUESTION_DURATION_MS) {
                // Question phase
                if (stage !== "question" || currentIndex !== qIndex) {
                    setStage("question");
                    setCurrentIndex(qIndex);
                    setSelectedIndex(null);
                    setIsCorrect(null);
                }
            } else {
                // Leaderboard phase
                if (stage !== "leaderboard" || currentIndex !== qIndex) {
                    setStage("leaderboard");
                }
            }
        }, 300); // tick every 0.3s

        return () => clearInterval(timer);
        // We intentionally omit some deps to avoid resetting timer too often.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startTime, questions.length]);

    // Render functions for different stages in tournament

    // Waiting for tournament to start
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
                    {!inProgress && (
                        <Button variant="primary" onClick={handleStart}>
                            Start Tournament
                        </Button>
                    )}
                </>
            )}
        </InfoBox>
    );

    // Render current question
    const renderQuestion = () => {
        const q = questions[currentIndex];
        if (!q) return null;

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

                        // Simple coloring / feedback for demo
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
                </div>
            </InfoBox>
        );
    };

    // Render leaderboard after question
    const renderLeaderboard = () => (
        <InfoBox title="Leaderboard">
            {/* For now, just show this player's score.
                Later you can replace with real tournament scores from backend. */}
            <p>
                Your score: <strong>{score}</strong>
            </p>
            <p>
                Current question: {Math.min(currentIndex + 1, questions.length)}{" "}
                / {questions.length}
            </p>

            {/* If not using synced timing (e.g., for testing), you can still manually advance */}
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

    // Main render screen
    return (
        <>
            {/* Top navigation header */}
            <HeaderBar
                title="Tournaments"
                xp={currentXP}
                collapsed={collapsed}
            />
            <div
                className={`headerSpacer ${collapsed ? "is-collapsed" : ""}`}
            />

            <ScreenScroll ref={scrollerRef}>
                <PullToRefresh scrollerRef={scrollerRef} onRefresh={refresh}>
                    {stage === "waiting" && renderWaiting()}
                    {stage === "question" && renderQuestion()}
                    {stage === "leaderboard" && renderLeaderboard()}
                </PullToRefresh>

                {/* Persistent bottom navigation space */}
                <div style={{ height: "var(--bottom-nav-height, 72px)" }} />
            </ScreenScroll>

            {/* Persistent bottom navigation */}
            <BottomNav />
        </>
    );
}
