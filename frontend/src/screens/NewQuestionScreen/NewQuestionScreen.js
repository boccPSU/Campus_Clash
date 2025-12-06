// Displays tournament game

import React, { useState, useEffect, useRef } from "react";
import useCollapseOnScroll from "../../components/hooks/useCollapseOnScroll.js";
import PullToRefresh from "../../components/interaction/PullToRefresh.js";
import ScreenScroll from "../../components/ScreenScroll/ScreenScroll.js";
import InfoTile from "../../newComponents/InfoTile/InfoTile.js";
import { Button, Container } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import MainPopup from "../../newComponents/MainPopup/MainPopup.js";
import XpHeaderBar from "../../newComponents/XpHeaderBar/XpHeaderBar.js";
import BottomNavBar from "../../newComponents/BottomNavBar/BottomNavBar.js";
import { useAuth } from "../../api/AuthContext.js";

// Timers for each question
const questionTime = 20; // 15s answer phase + 5s reveal
const answerTime = 15; // timer bar duration
const REVEAL_PHASE_SECONDS = 5; // last 5 seconds
const REVEAL_AT_SECONDS = REVEAL_PHASE_SECONDS; // when timeLeft === 5

// Powerup costs (gems)
const ELIMINATE_COST = 200;
const SKIP_COST = 500;
const ADDTIME_COST = 100;

export default function NewQuestionScreen() {
    const location = useLocation();
    const navState = location.state || {};
    const navTitle = navState.title || "Tournament";
    const navId = navState.tournamentId;
    const navType = navState.tournamentType;
    const { studentData, loadStudentData, loadBasicStudentData } = useAuth();
    const navigate = useNavigate();

    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const [selectedIndex, setSelectedIndex] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);
    const [score, setScore] = useState(0);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // "loading" | "question" | "gameover"
    const [stage, setStage] = useState("loading");

    const [timeLeft, setTimeLeft] = useState(questionTime);

    // --- Powerup related state ---
    // TODO: replace with real gem value from backend / context
    const [gems, setGems] = useState(0);

    const [usedEliminate, setUsedEliminate] = useState(false);
    const [usedSkip, setUsedSkip] = useState(false);
    const [usedAddTime, setUsedAddTime] = useState(false);

    // Which answer indices have been eliminated (hidden)
    const [eliminatedIndexes, setEliminatedIndexes] = useState([]);

    // Popup + pending navigation path
    const [showLeavePopup, setShowLeavePopup] = useState(false);
    const [pendingPath, setPendingPath] = useState(null);

    const timerRef = useRef(null);
    const answerTimeoutRef = useRef(null);
    const hasAnsweredRef = useRef(false);

    const scrollerRef = useRef(null);
    const collapsed = useCollapseOnScroll(scrollerRef);

    // Set gems on mount
    useEffect(() => {
        if (studentData && typeof studentData.gems === "number") {
            console.log(
                "[QuestionScreen] Setting initial gems:",
                studentData.gems
            );
            setGems(studentData.gems);
        }
    }, [studentData?.gems]);

    // Helper function to spend gems on powerups
    const spendGems = async (amount) => {
        try {
            const gemCost = amount;
            // Call backed to deduct gems returns true if successful
            const res = await fetch("http://localhost:5000/api/gems/remove", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: studentData.username,
                    amount: gemCost,
                }),
            });

            const data = await res.json();

            const isSuccessful = data.successful;

            if (isSuccessful) {
                // We are good to deduct gems
                setGems((prev) => prev - amount);

                // Update student gem amount with load BASIC data
                await loadBasicStudentData();
                return true;
            }

            console.error(
                "Backend rejected gem deduction for Add Time powerup message" +
                    data
            );
            return false;
        } catch (error) {
            console.error("Error spending gems:", error);
        }
    };

    const loadQuestions = async () => {
        try {
            setLoading(true);
            setError("");

            const res = await fetch(
                `http://localhost:5000/api/tournament/questions/${encodeURIComponent(
                    navId
                )}`
            );

            if (res.status === 204) {
                console.log("No questions available for this tournament yet.");
                setQuestions([]);
                setStage("gameover");
                return;
            }

            if (!res.ok) {
                throw new Error(`Failed to load questions (${res.status})`);
            }

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

    const refresh = async () => {
        await loadQuestions();
    };

    useEffect(() => {
        loadQuestions();
    }, []);

    useEffect(() => {
        if (stage !== "question" || !questions[currentIndex]) return;

        hasAnsweredRef.current = false;
        setSelectedIndex(null);
        setIsCorrect(null);
        setTimeLeft(questionTime);

        // reset powerups per-question
        setUsedEliminate(false);
        setUsedSkip(false);
        setUsedAddTime(false);
        setEliminatedIndexes([]);

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (answerTimeoutRef.current) {
            clearTimeout(answerTimeoutRef.current);
            answerTimeoutRef.current = null;
        }

        const revealCorrectAnswer = () => {
            const q = questions[currentIndex];
            if (!q) return;
            setSelectedIndex(q.correctIndex);
        };

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                const next = prev - 1;

                if (next === REVEAL_AT_SECONDS && !hasAnsweredRef.current) {
                    revealCorrectAnswer();
                }

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

    useEffect(() => {
        if (stage !== "gameover") return;

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (answerTimeoutRef.current) {
            clearTimeout(answerTimeoutRef.current);
            answerTimeoutRef.current = null;
        }

        const sendFinalScore = async () => {
            try {
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

                console.log(
                    "Trying to set new score:",
                    score + " for tournament " + navId
                );
                const res = await fetch(
                    "http://localhost:5000/api/tournament/update-score",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "jwt-token": tokenValue,
                        },
                        body: JSON.stringify({
                            score,
                            tid: navId,
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

        const giveXpToUser = async (navType) => {
            let xpAmount;
            let username;

            try {
                const tokenString = localStorage.getItem("token");
                if (!tokenString) {
                    console.warn(
                        "No token in localStorage, skipping XP update"
                    );
                    return;
                }

                let parsed;
                try {
                    parsed = JSON.parse(tokenString);
                } catch (err) {
                    console.error(
                        "Failed to parse token from localStorage:",
                        err
                    );
                    return;
                }

                const token = parsed?.token;
                if (!token) {
                    console.warn(
                        "Parsed token object has no .token field, skipping XP update"
                    );
                    return;
                }

                const res = await fetch(
                    "http://localhost:5000/api/current-user",
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            "jwt-token": token,
                        },
                    }
                );

                if (!res.ok) {
                    console.error(
                        "Failed to get current user:",
                        res.status,
                        res.statusText
                    );
                    return;
                }

                const data = await res.json();
                username = data.username;

                if (!username) {
                    console.error(
                        "No username returned from /api/current-user",
                        data
                    );
                    return;
                }

                if (navType === "daily") {
                    xpAmount = 200;
                } else if (navType === "weekly") {
                    xpAmount = 300;
                } else if (navType === "ranked") {
                    xpAmount = 400;
                } else {
                    console.warn("Unknown navType for XP:", navType);
                    return;
                }

                console.log("Giving", xpAmount, "XP to user", username);
            } catch (e) {
                console.log("Error getting username or xp amount", e);
                return;
            }

            try {
                console.log("About to call /api/receive-xp with", {
                    username,
                    reward: xpAmount,
                });

                const res = await fetch(
                    "http://localhost:5000/api/receive-xp",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            username,
                            reward: xpAmount,
                        }),
                    }
                );

                const body = await res.json().catch(() => null);

                if (!res.ok || !body?.success) {
                    console.log(
                        "[Question Screen] Failed to add XP:",
                        res.status,
                        body
                    );
                    return;
                }

                console.log(
                    "[Question Screen] Added",
                    xpAmount,
                    "XP to user",
                    username
                );

                //  Refresh studentData so XpHeaderBar sees new XP
                await loadStudentData();
            } catch (e) {
                console.log("[QuestionScreen] Error adding XP:", e);
            }
        };

        giveXpToUser(navType);
        sendFinalScore();
    }, [stage, score, navId]);

    const handleAnswer = (index) => {
        if (stage !== "question") return;
        if (!questions[currentIndex]) return;
        if (hasAnsweredRef.current) return;
        hasAnsweredRef.current = true;

        const q = questions[currentIndex];
        const correct = index === q.correctIndex;

        setSelectedIndex(index);
        setIsCorrect(correct);

        if (correct) {
            setScore((prev) => prev + 100);
        }

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        setTimeLeft(REVEAL_PHASE_SECONDS);

        if (answerTimeoutRef.current) {
            clearTimeout(answerTimeoutRef.current);
        }
        answerTimeoutRef.current = setTimeout(() => {
            handleNextQuestion();
        }, REVEAL_PHASE_SECONDS * 1000);
    };

    const handleNextQuestion = () => {
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

    // Powerup handlers

    const handleEliminateAnswer = () => {
        if (stage !== "question") return;
        if (!questions[currentIndex]) return;
        if (hasAnsweredRef.current) return;
        if (usedEliminate) return;

        const isSuccessful = spendGems(ELIMINATE_COST);

        if (!isSuccessful) {
            console.log("[GEMS] Not enough gems to eliminate answer");
            return;
        }

        const q = questions[currentIndex];

        const wrongIndices = q.options
            .map((_, idx) => idx)
            .filter(
                (idx) =>
                    idx !== q.correctIndex && !eliminatedIndexes.includes(idx)
            );

        if (wrongIndices.length === 0) return;

        const randomIndex =
            wrongIndices[Math.floor(Math.random() * wrongIndices.length)];

        setEliminatedIndexes((prev) => [...prev, randomIndex]);
        setUsedEliminate(true);
        // TODO: sync gem deduction with backend
        setGems((prev) => prev - ELIMINATE_COST);
    };

    // Skip should count as a correct answer
    const handleSkipQuestionPowerup = () => {
        if (stage !== "question") return;
        if (!questions[currentIndex]) return;
        if (hasAnsweredRef.current) return;
        if (usedSkip) return;

        const isSuccessful = spendGems(SKIP_COST);

        if (!isSuccessful) {
            console.log("[GEMS] Not enough gems to skip question");
            return;
        }

        const q = questions[currentIndex];

        setUsedSkip(true);
        // TODO: sync gem deduction with backend
        setGems((prev) => prev - SKIP_COST);

        // Treat as if user clicked the correct answer
        handleAnswer(q.correctIndex);
    };

    const handleAddTimePowerup = async () => {
        if (stage !== "question") return;
        if (!questions[currentIndex]) return;
        if (hasAnsweredRef.current) return;
        if (usedAddTime) return;

        // Try and spend gems
        const isSuccessful = await spendGems(ADDTIME_COST);

        // We are good to deduct gems
        if (isSuccessful) {
            setUsedAddTime(true);
            setTimeLeft((prev) => prev + 20);
        }
    };

    // For game over "Return to Tournaments" button
    const handleReturnToTournament = () => {
        navigate("/tournament");
    };

    // Handle clicks from BottomNavBar
    const handleBottomNavClick = (path) => {
        if (stage === "question") {
            setPendingPath(path);
            setShowLeavePopup(true);
        } else {
            navigate(path);
        }
    };

    const handleLeave = () => {
        setShowLeavePopup(false);
        if (pendingPath) {
            navigate(pendingPath);
        } else {
            navigate("/tournament");
        }
    };

    const handleStay = () => {
        setShowLeavePopup(false);
        setPendingPath(null);
    };

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

        const effectiveTime = Math.max(
            Math.min(timeLeft - REVEAL_PHASE_SECONDS, answerTime),
            0
        );
        const progressPercent = (effectiveTime / answerTime) * 100;

        const eliminateDisabled =
            selectedIndex !== null || usedEliminate || gems < ELIMINATE_COST;
        const skipDisabled =
            selectedIndex !== null || usedSkip || gems < SKIP_COST;
        const addTimeDisabled =
            selectedIndex !== null || usedAddTime || gems < ADDTIME_COST;

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
                                if (eliminatedIndexes.includes(idx)) {
                                    // Eliminated answer: hide it
                                    return null;
                                }

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
                                        disabled={selectedIndex !== null}
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

                        {/* Powerups section */}
                        <div className="questionPowerups">
                            <div className="questionPowerupButtons">
                                <div className="powerupItem">
                                    <div className="powerupCostLabel">
                                        200 Gems
                                    </div>
                                    <button
                                        type="button"
                                        className="powerupBtn"
                                        onClick={handleEliminateAnswer}
                                        disabled={eliminateDisabled}
                                    >
                                        Drop Answer
                                    </button>
                                </div>

                                <div className="powerupItem">
                                    <div className="powerupCostLabel">
                                        500 Gems
                                    </div>
                                    <button
                                        type="button"
                                        className="powerupBtn"
                                        onClick={handleSkipQuestionPowerup}
                                        disabled={skipDisabled}
                                    >
                                        Skip Question
                                    </button>
                                </div>

                                <div className="powerupItem">
                                    <div className="powerupCostLabel">
                                        100 Gems
                                    </div>
                                    <button
                                        type="button"
                                        className="powerupBtn"
                                        onClick={handleAddTimePowerup}
                                        disabled={addTimeDisabled}
                                    >
                                        +20 Seconds
                                    </button>
                                </div>
                            </div>
                        </div>

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

    return (
        <>
            <XpHeaderBar />

            <div
                className={`headerSpacer ${collapsed ? "is-collapsed" : ""}`}
            />

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

            <BottomNavBar onNavClick={handleBottomNavClick} />

            <MainPopup
                open={showLeavePopup}
                title="Leave tournament?"
                message="If you leave now, you will not be able to rejoin."
                buttonLabel1="Leave"
                buttonLabel2="Stay"
                onButton1={handleLeave}
                onButton2={handleStay}
                onClose={handleStay}
                type={"alert"}
            >
                {/* optional extra content here */}
            </MainPopup>
        </>
    );
}
