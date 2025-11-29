// Displays tournament game

import React, { useState, useEffect, useRef } from "react";
import BottomNav from "../../components/BottomNav/BottomNav.js";
import HeaderBar from "../../components/HeaderBar/HeaderBar.js";
import useCollapseOnScroll from "../../components/hooks/useCollapseOnScroll.js";
import PullToRefresh from "../../components/interaction/PullToRefresh.js";
import ScreenScroll from "../../components/ScreenScroll/ScreenScroll.js";
import InfoTile from "../../newComponents/InfoTile/InfoTile.js";
import { Button, Container } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";

// Timers for each question
const questionTime = 20; // 15s answer phase + 5s reveal
const answerTime = 15; // timer bar duration
const REVEAL_PHASE_SECONDS = 5; // last 5 seconds
const REVEAL_AT_SECONDS = REVEAL_PHASE_SECONDS; // when timeLeft === 5

export default function NewQuestionScreen() {

    // Data passed from tournament card using navigate()
    const location = useLocation();
    const navState = location.state || {};
    const navTitle = navState.title || "Tournament";
    const navId    = navState.tournamentId;

    const navigate = useNavigate();

    // Important states

    const [questions, setQuestions] = useState([]);         // List of questions
    const [currentIndex, setCurrentIndex] = useState(0);    // Current question index (question 1, question 2, ...)

    const [selectedIndex, setSelectedIndex] = useState(null); // which answer user clicked or auto-revealed
    const [isCorrect, setIsCorrect] = useState(null); // true / false 
    const [score, setScore] = useState(0);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Game states (loading, question, gameOver)
    const [stage, setStage] = useState("loading");

    // Timer for the current question (counts down from 20)
    const [timeLeft, setTimeLeft] = useState(questionTime);

    // Refs for timers / guards
    const timerRef = useRef(null);
    const answerTimeoutRef = useRef(null);
    const hasAnsweredRef = useRef(false); // true only if the student clicked an answer

    // Header UI
    const scrollerRef = useRef(null);
    const collapsed = useCollapseOnScroll(scrollerRef);

    // Load questions for this tournament  
    const loadQuestions = async () => {
        try {
            setLoading(true);
            setError("");

            // Get question set from tournament table
            const res = await fetch(
                `http://localhost:5000/api/tournament/questions/${encodeURIComponent(
                    navId
                )}`
            );

            // If there are no questions go to game over screen 
            if (res.status === 204) {
                console.log("No questions available for this tournament yet.");
                setQuestions([]);
                setStage("gameover");
                return;
            }

            if (!res.ok) {
                throw new Error(`Failed to load questions (${res.status})`);
            }

            // Get questions
            const data = await res.json();
            const loadedQuestions = data.questions || [];

            if (
                !Array.isArray(loadedQuestions) ||
                loadedQuestions.length === 0
            ) {
                console.log("No questions found for this tournament.");
                setQuestions([]);
                setStage("gameover");
                return;
            }

            // initialize start of tournament questions
            setQuestions(loadedQuestions);
            setCurrentIndex(0);
            setSelectedIndex(null);
            setIsCorrect(null);
            setScore(0);
            setStage("question");
        } catch (err) {
            console.error(err);
            setError(err.message || "Unable to load questions");
            console.log("Could not load questions");
            setStage("gameover");
        } finally {
            setLoading(false);
        }
    };

    // Used by PullToRefresh to reload questions
    const refresh = async () => {
        await loadQuestions();
    };

    // Initial load on mount
    useEffect(() => {
        loadQuestions();
    }, []);

    // Per question timer set up
    useEffect(() => {
        // Make sure we are in question stage
        if (stage !== "question" || !questions[currentIndex]) return;

        // Reset question state
        hasAnsweredRef.current = false;
        setSelectedIndex(null);
        setIsCorrect(null);
        setTimeLeft(questionTime);

        // Clear old timers
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (answerTimeoutRef.current) {
            clearTimeout(answerTimeoutRef.current);
            answerTimeoutRef.current = null;
        }

        // Helper function to reveal correct anser if user has not selected one in time
        const revealCorrectAnswer = () => {
            const q = questions[currentIndex];
            if (!q) return;
            // Show correct answer visually (green), but do not give any points
            setSelectedIndex(q.correctIndex);
        };

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                const next = prev - 1;

                // At 5 seconds left, if user hasn't answered, reveal correct answer
                if (next === REVEAL_AT_SECONDS && !hasAnsweredRef.current) {
                    revealCorrectAnswer();
                }

                // Time is up, auto-advance
                if (next <= 0) {
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                    handleNextQuestion();
                    return 0;
                }

                return next;
            });
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [stage, currentIndex, questions.length]);

    // Handle game over stage
    useEffect(() => {
        if (stage !== "gameover") return;

        // Stop timers
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (answerTimeoutRef.current) {
            clearTimeout(answerTimeoutRef.current);
            answerTimeoutRef.current = null;
        }

        // Send final score to backend
        const sendFinalScore = async () => {
            try {
                // Get user token
                const tokenString = localStorage.getItem("token");
                if (!tokenString) {
                    console.warn("No token found, skipping score update");
                    return;
                }

                let tokenValue = "";
                try {
                    const parsed = JSON.parse(tokenString);
                    tokenValue = parsed.token || tokenString;
                } catch {
                    tokenValue = tokenString;
                }

                console.log("Trying to set new score:", score);
                console.log("Nav id " + navId);
                const res = await fetch(
                    "http://localhost:5000/api/tournament/update-score",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "jwt-token": tokenValue,
                        },
                        body: JSON.stringify({
                            score, // Player’s final score
                            tid: navId, // Tournaments title
                        }),
                    }
                );

                const data = await res.json().catch(() => null);

                if (!res.ok || !data?.successful) {
                    console.error("Failed to update score:", data);
                } else {
                    console.log("Score updated successfully:", data);
                }
            } catch (e) {
                console.log("Error updating score:", e);
            }
        };
        sendFinalScore();
    }, [stage, score, navId]);

    // Answer handling
    const handleAnswer = (index) => {
        if (stage !== "question") return;
        if (!questions[currentIndex]) return;

        // Don't allow multiple answers / changing answer
        if (hasAnsweredRef.current) return;
        hasAnsweredRef.current = true;

        const q = questions[currentIndex];
        const correct = index === q.correctIndex;

        setSelectedIndex(index);
        setIsCorrect(correct);

        if (correct) {
            setScore((prev) => prev + 100);
        }

        // Stop main timer and start the 5-second reveal/transition window
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        setTimeLeft(REVEAL_PHASE_SECONDS); // visually in reveal window (but bar is already at 0)

        if (answerTimeoutRef.current) {
            clearTimeout(answerTimeoutRef.current);
        }
        answerTimeoutRef.current = setTimeout(() => {
            handleNextQuestion();
        }, REVEAL_PHASE_SECONDS * 1000);
    };

    const handleNextQuestion = () => {
        // Clear any "after answer" timeout
        if (answerTimeoutRef.current) {
            clearTimeout(answerTimeoutRef.current);
            answerTimeoutRef.current = null;
        }

        if (currentIndex < questions.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setStage("question");
        } else {
            console.log("Final question reached");
            setStage("gameover");
        }
    };

    const handleReturnToTournament = () => {
        navigate(-1);
    };

    // Render helper functions
    const renderLoadingOrError = () => (
        <div className="questionTile">
            <InfoTile title={navTitle}>
                <div className="questionContent">
                    {loading && <p>Loading questions...</p>}
                    {error && (
                        <p style={{ color: "var(--danger-color, #ff4d4f)" }}>
                            {error}
                        </p>
                    )}
                    {!loading && !error && <p>Preparing your questions…</p>}
                </div>
            </InfoTile>
        </div>
    );

    const renderQuestion = () => {
        const q = questions[currentIndex];

        if (!q) {
            return (
                <div className="questionTile">
                    <InfoTile title={navTitle}>
                        <div className="questionContent">
                            <p>No question available.</p>
                        </div>
                    </InfoTile>
                </div>
            );
        }

        // Progress bar for the answer phase only (first 15 seconds)
        // timeLeft goes from 20 to 5 during answer phase.
        const effectiveTime = Math.max(
            Math.min(timeLeft - REVEAL_PHASE_SECONDS, answerTime),
            0
        );
        const progressPercent = (effectiveTime / answerTime) * 100;

        return (
            <div className="questionTile">
                <InfoTile
                    title={`Question ${currentIndex + 1} of ${
                        questions.length
                    }`}
                >
                    <div className="questionContent">
                        {(q.category || q.difficulty) && (
                            <div className="questionCategory">
                                <h6>
                                    {q.category && q.category}{" "}
                                    {q.category && q.difficulty && "•"}{" "}
                                    {q.difficulty && q.difficulty}
                                </h6>
                            </div>
                        )}

                        <div className="questionText">
                            <h4>{q.question}</h4>
                        </div>

                        <div className="questionAnswers">
                            {q.options.map((opt, idx) => {
                                const isSelected = idx === selectedIndex;
                                const isCorrectOpt = idx === q.correctIndex;

                                let variant = "outline-secondary";

                                if (selectedIndex !== null) {
                                    if (isCorrectOpt) {
                                        variant = "success";
                                    } else if (isSelected) {
                                        variant = "danger";
                                    }
                                }

                                return (
                                    <Button
                                        key={idx}
                                        variant={variant}
                                        onClick={() => handleAnswer(idx)}
                                        disabled={selectedIndex !== null} // locked after answer or reveal
                                    >
                                        {opt}
                                    </Button>
                                );
                            })}
                        </div>

                        <div className="questionMetaRow">
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

                        {/* Timer bar along the bottom (15s only) */}
                        <div className="questionTimerBar">
                            <div className="questionTimerTrack">
                                <div
                                    className="questionTimerFill"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </InfoTile>
            </div>
        );
    };

    const renderGameOver = () => (
        <div className="questionTile">
            <InfoTile title="Game Over">
                <div className="questionContent">
                    <p>
                        Final score: <strong>{score}</strong>
                    </p>
                    <p>
                        Questions answered: <strong>{questions.length}</strong>
                    </p>

                    <div className="gameOverActions">
                        <Button
                            variant="primary"
                            onClick={handleReturnToTournament}
                        >
                            Return to Tournaments
                        </Button>
                    </div>
                </div>
            </InfoTile>
        </div>
    );

    // Main render
    return (
        <>
            {/* Top navigation header */}
            <HeaderBar title="Tournaments" collapsed={collapsed} />

            {/* Spacer to push content below the header when fixed */}
            <div
                className={`headerSpacer ${collapsed ? "is-collapsed" : ""}`}
            />

            {/* Scrollable content area with pull-to-refresh */}
            <ScreenScroll ref={scrollerRef}>
                <PullToRefresh scrollerRef={scrollerRef} onRefresh={refresh}>
                    <Container className="mainContainer questionMain">
                        {stage === "loading" && renderLoadingOrError()}
                        {stage === "question" && renderQuestion()}
                        {stage === "gameover" && renderGameOver()}

                        <div className="bottomNavSpacer" />
                    </Container>
                </PullToRefresh>
            </ScreenScroll>

            {/* Persistent bottom navigation bar */}
            <BottomNav />
        </>
    );
}
