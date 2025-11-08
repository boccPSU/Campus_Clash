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

    // State Vars
    // Different stages: waiting, question, leaderboard
    const [stage, setStage] = useState("waiting");

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

            // Hiting local dev server 
            const res = await fetch("http://localhost:5000/api/generate-questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category: DEFAULT_CATEGORY,
                    difficulty: DEFAULT_DIFFICULTY,
                    count: QUESTION_COUNT,
                }),
            });

            if (!res.ok) {
                throw new Error(`Failed to load questions (${res.status})`);
            }

            // Get questions back from API
            const data = await res.json();

            if (!data.questions || !Array.isArray(data.questions)) {
                throw new Error("Invalid questions format from API");
            }

            // Set all state vars for a new round
            setQuestions(data.questions);
            setCurrentIndex(0);
            setSelectedIndex(null);
            setIsCorrect(null);
            setScore(0);
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

    // Start the tournament, move from waiting state to question state for first question
    const handleStart = () => {
        //This should be done on a timer

        setStage("question");
        setCurrentIndex(0);
    };

    // Handle answer click
    const handleAnswer = (index) => {
        if (selectedIndex !== null) return; // already answered

        // Get current question and correct answer index and compare to selected index
        const q = questions[currentIndex];
        const correct = index === q.correctIndex;

        setSelectedIndex(index);
        setIsCorrect(correct);

        if (correct) {
            // Set score, make this more complex later (time-based)
            setScore((prev) => prev + 100);
        }

        // Need to move to leaderboard in a synced way after question is displayed
        setTimeout(() => {
            setStage("leaderboard");
        }, 800);
    };

    // Go to next question after leaderboard screen
    const handleNextQuestion = () => {
        const next = currentIndex + 1;
        if (next >= questions.length) {
            // No more questions, go to game end state
            return;
        }

        //Set current question index to next question
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
                        Category: <strong>{DEFAULT_CATEGORY}</strong>{" "}
                        | Difficulty: <strong>{DEFAULT_DIFFICULTY}</strong>
                    </p>
                    <p>
                        Questions loaded:{" "}
                        <strong>{questions.length}</strong>
                    </p>
                    <Button
                        variant="primary"
                        onClick={handleStart}
                        disabled={!questions.length}
                    >
                        Start Round
                    </Button>
                    <Button
                        variant="outline-secondary"
                        onClick={loadQuestions}
                        style={{ marginLeft: 8 }}
                    >
                        Reload Questions
                    </Button>
                </>
            )}
        </InfoBox>
    );

    // Render current question
    const renderQuestion = () => {
        const q = questions[currentIndex];
        if (!q) return null;

        return (
            <InfoBox title={`Question ${currentIndex + 1} of ${questions.length}`}>
                <div className="QuestionCategory">
                    <h6>{q.category} • {q.difficulty}</h6>
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
                    <p>Your score: <strong>{score}</strong></p>
                </div>
            </InfoBox>
        );
    };

    // Render leaderboard after question
    const renderLeaderboard = () => (
        <InfoBox title="Leaderboard">
            {/* For now, just show this player's score.
                Later you can replace with real tournament scores from backend. */}
            <p>Your score: <strong>{score}</strong></p>
            <p>Current question: {currentIndex + 1} / {questions.length}</p>

            {currentIndex + 1 < questions.length ? (
                <Button variant="primary" onClick={handleNextQuestion}>
                    Next Question
                </Button>
            ) : (
                <p>Round complete 🎉</p>
            )}

            <Button
                variant="outline-secondary"
                onClick={loadQuestions}
                style={{ marginLeft: 8 }}
            >
                New Round
            </Button>
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
