// Displays tournament game

import React, { useRef, useState, useEffect } from "react";
import InfoBox from "../components/InfoBox/InfoBox";
import BottomNav from "../components/BottomNav/BottomNav.js";
import HeaderBar from "../components/HeaderBar/HeaderBar.js";
import useCollapseOnScroll from "../components/hooks/useCollapseOnScroll.js";
import PullToRefresh from "../components/interaction/PullToRefresh.js";
import ScreenScroll from "../components/ScreenScroll/ScreenScroll.js";
import { Button } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";

export default function QuestionScreen() {
    // Used to get data from navigate() function
    const location = useLocation();
    const navState = location.state || {};
    const navTitle = navState.title; // Tournament title used to fetch its questions

    const navigate = useNavigate(); // used to go back to tournament screen

    // Timing configuration (shared by all players)
    // Every player uses the same schedule relative to the tournament's startTime.
    // The "tournamentStartTime" is: startTime + PREP_DURATION_MS

    //---------------------------------------//
    //---------------------------------------//
    // CHANGE THESE TIMES IF NEEDED FOR DEMO //
    //---------------------------------------//
    //---------------------------------------//
    const PREP_DURATION_MS = 20_000; // Time from startTime until first question
    const QUESTION_DURATION_MS = 10_000; // Duration of each question
    const LEADERBOARD_DURATION_MS = 5_000; // Leaderboard time between questions
    const CYCLE_DURATION_MS = QUESTION_DURATION_MS + LEADERBOARD_DURATION_MS; // One full question + leaderboard cycle

    // -----------------------------
    // State variables
    // -----------------------------

    // Which "screen" is currently active:
    //  - "waiting": before first question / during prep or between questions
    //  - "question": actively answering a question
    //  - "leaderboard": showing score and waiting for next question
    //  - "gameover": final leaderboard after all questions
    const [stage, setStage] = useState("waiting");

    // The full list of questions for this tournament and the current index
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Answer selection and scoring for this player
    const [selectedIndex, setSelectedIndex] = useState(null); // Which answer the player clicked
    const [isCorrect, setIsCorrect] = useState(null); // true/false/null (null = not answered yet)
    const [score, setScore] = useState(0); // Player's score across questions
    const [inProgress, setInProgress] = useState(false);
    // Loading / error state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Tournament data from backend
    const [startTime, setStartTime] = useState(null); // ms timestamp
    const [topics, setTopics] = useState();
    const [difficulty, setDifficulty] = useState();
    const [reward, setReward] = useState();
    const [tid, setTid] = useState(null); // Tournament ID from backend
    const [authToken, setAuthToken] = useState("");
    const [username, setUsername] = useState("");
    const [leaderboard, setLeaderboard] = useState([]); // [{ username, score }, ...]

    // Ref to hard-block multiple answers per question (prevents multi-click scoring)
    const hasAnsweredRef = useRef(false);

    // Tracks which question index is currently active in the timer, so we only reset selection when the index actually changes.
    const previousQuestionIndexRef = useRef(null);

    // Used for auto-return on game over screen
    const gameOverTimeoutRef = useRef(null);

    // Header UI
    const scrollerRef = useRef(null);
    const collapsed = useCollapseOnScroll(scrollerRef);

    //Used to prevent double useEffect calls in dev mode.
    const joinedRef = useRef(false);

    // Loads questions by tournament title
    const loadQuestions = async () => {
        if (!navTitle) {
            setError("Missing tournament title from navigation.");
            return;
        }
            try {
            setLoading(true);
            setError("");

            let questionsFound = false;

            while (!questionsFound) {
                const res = await fetch(
                    `http://localhost:5000/api/tournament/questions/${encodeURIComponent(
                        navTitle
                    )}`
                );
                
                if (res.status === 204) {
                    continue;
                }
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
                questionsFound = true;
                setStage("waiting");
            }
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
            setError(
                "This tournament has already started. Please join the next one."
            );
            return false;
        }

        return true;
    };

    // -----------------------------
    // Initial tournament join + data load
    // -----------------------------
    // When the user navigates to this screen:
    //  1. Join the current tournament (based on JWT token).
    //  2. Fetch /api/current-tournament to get topics, difficulty, startTime.
    //  3. Call syncPlayer(startTimeMs) to see if they arrived too late.
    //  4. If not too late, set startTime so the timer effect can drive the stages.
    const initTournament = async () => {
        console.log(
            "Initializing tournament... token is " +
                sessionStorage.getItem("token")
        );
        setError("");

        const tokenString = sessionStorage.getItem("token");
        if (!tokenString) {
            setError("No token found in session. Please log in again.");
            return;
        }

        let tokenValue = "";
        let parsedToken = null;
        try {
            parsedToken = JSON.parse(tokenString);
            tokenValue = parsedToken.token;
        } catch {
            setError("Invalid token format. Please log in again.");
            return;
        }

        console.log("Parsed Token:", parsedToken);
        console.log("Token Value -----------", tokenValue);

        // Store for later API calls
        setAuthToken(tokenValue);

        // Get the current user via backend
        try {
            const userRes = await fetch(
                "http://localhost:5000/api/current-user",
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "jwt-token": tokenValue, // backend uses this header to decrypt
                    },
                }
            );

            if (!userRes.ok) {
                throw new Error(
                    `Failed to get current user (${userRes.status})`
                );
            }

            const userData = await userRes.json();
            console.log("current-user response:", userData);

            if (userData.username) {
                setUsername(userData.username);
                console.log("Set username state to:", userData.username);
            } else {
                console.log("current-user response has no 'username' field");
            }
        } catch (e) {
            console.log("Failed to get current user:", e);
        }

        //console.log("User token in initTournament:", tokenValue);

        try {
            setInProgress(true);

            // Join the tournament for this user
            await fetch("http://localhost:5000/api/join-tournament", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "jwt-token": tokenValue,
                },
            });

            // Fetch tournament data
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
            console.log("current-tournament response:", t);

            // Capture tid for score + leaderboard endpoints
            if (t.tid) {
                setTid(t.tid);
            } else {
                console.log(
                    "Tournament object has no tid"
                );
            }

            // Set tournament topics and difficulty
            if (t.topics) setTopics(t.topics);
            if (t.difficulty) setDifficulty(t.difficulty);
            if (t.reward) setReward(t.reward);

            // Get current time
            let startTimeMs;
            if (t.startTime) {
                startTimeMs = new Date(t.startTime).getTime();
            } else {
                startTimeMs = Date.now();
            }

            // Check if user can join
            const okToJoin = syncPlayer(startTimeMs);
            if (!okToJoin) {
                setInProgress(false);
                return;
            }

            setStartTime(startTimeMs);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to initialize tournament");
            setInProgress(false);
        }
    };

    // Helper function that sends users new score to server (can change this to only call if user is correct later)
    const pushScoreToServer = async (newScore) => {
        if (!tid || !username) {
            console.log(
                "pushScoreToServer: missing tid or username, skipping update",
                { tid, username }
            );
            return;
        }

        // Update score via backend
        try {
            const res = await fetch(
                `http://localhost:5000/api/tournament/update-score/${encodeURIComponent(
                    username
                )}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(authToken ? { "jwt-token": authToken } : {}),
                    },
                    body: JSON.stringify({ tid, score: newScore }),
                }
            );

            let data = null;
            try {
                data = await res.json();
            } catch (e) {
                console.log("Failed to get data in questions screen Error: " + e);
            }

        } catch (e) {
            console.log("Failed to update score on server Error: " + e);
        }
    };

    // Fetches leaderboard data from the backend (tournament_participant table)
    const loadLeaderboard = async () => {
        
        // Get all participating users info (Username + score)
        try {
            const res = await fetch(
                "http://localhost:5000/api/tournament/participating-users-info",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ tid }),
                }
            );

            if (!res.ok) {
                throw new Error(`Failed to load leaderboard (${res.status})`);
            }

            const data = await res.json();
            setLeaderboard(data.participants || []);
        } catch (err) {
            console.error("Failed to load leaderboard:", err);
        }
    };

    // Called whenver user clicks button to ansewr 
    const handleAnswer = (index) => {
        // Do not allow answering outside of "question" stage
        if (stage !== "question") return;

        // Hard guard to prevent multiple answers / multiple scoring per question
        if (hasAnsweredRef.current) {
            console.log("Ignored extra click for this question");
            return;
        }
        hasAnsweredRef.current = true;

        const q = questions[currentIndex];
        if (!q) return;

        const correct = index === q.correctIndex;

        setSelectedIndex(index);
        setIsCorrect(correct);

        if (correct) {
            // Change this to be time based later
            setScore((prev) => {
                const updated = prev + 100;
                // Immediately try to sync with backend
                pushScoreToServer(updated);
                return updated;
            });
        }
    };

    // Navigate back to the tournament screen (previous page)
    // Delete tournament here later
    const handleReturnToTournament = () => {
        // Clear any pending auto-return timeout
        if (gameOverTimeoutRef.current) {
            clearTimeout(gameOverTimeoutRef.current);
            gameOverTimeoutRef.current = null;
        }
        navigate(-1);
    };

    // Initial load on mount
    useEffect(() => {
        // On load, load questions and initialize the tournament
        if (joinedRef.current) return;
        joinedRef.current = true;

        loadQuestions();
        initTournament();
    }, []);

    // Load leaderboard when entering leaderboard or gameover stag
    useEffect(() => {
        if (stage !== "leaderboard" && stage !== "gameover") return;
        if (!tid) return;
        loadLeaderboard();
    }, [stage, tid]);

    // -----------------------------
    // Tournament timing loop
    // -----------------------------
    // This effect:
    //  - Depends on startTime and questions.length
    //  - On each tick (every 300 ms), computes how far we are from startTime
    //  - Chooses correct stage: "waiting", "question", "leaderboard", or "gameover"
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
    
            // If we somehow go beyond the last question (extra safety), end game.
            if (qIndex >= questions.length) {
                setStage("gameover");
                setInProgress(false);
                clearInterval(timer);
                return;
            }
    
            // Position within the current question+leaderboard cycle
            const withinCycle = sincePrep % CYCLE_DURATION_MS;
    
            if (withinCycle < QUESTION_DURATION_MS) {
                // We are in the "question answering" phase
                setStage("question");
    
                // Only when the question index changes do we reset the answer state
                if (previousQuestionIndexRef.current !== qIndex) {
                    previousQuestionIndexRef.current = qIndex;
                    setCurrentIndex(qIndex);
                    setSelectedIndex(null);
                    setIsCorrect(null);
                    hasAnsweredRef.current = false; // reset per-question answer guard
                }
            } else {
                // We are in the "leaderboard" phase between questions,
                // BUT if this is the LAST question, go straight to gameover instead.
                if (qIndex === questions.length - 1) {
                    setStage("gameover");
                    setInProgress(false);
                    clearInterval(timer);
                    return;
                }
    
                setStage("leaderboard");
            }
        }, 300); // Tick every 0.3s
    
        return () => clearInterval(timer);
    }, [startTime, questions.length]);
    

    // Game over auto-return
    // When stage is "gameover", show leaderboard and then navigate back to tournament screen after a short delay.
    useEffect(() => {
        if (stage !== "gameover") {
            // If we leave gameover, clear any pending timeout
            if (gameOverTimeoutRef.current) {
                clearTimeout(gameOverTimeoutRef.current);
                gameOverTimeoutRef.current = null;
            }
            return;
        }

        let topScore = 0;
        leaderboard.map((p, i) => {
            if (topScore < p.score) {
                topScore = p.score;
            } 
        });
        if (score == topScore) {
            try {
                fetch("/api/receive-xp", 
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({username, reward})
                    }
                );
            } catch (err) {
                throw new Error("Add XP Error");
            }
        }

        // Auto-return after 10 seconds
        gameOverTimeoutRef.current = setTimeout(() => {
            navigate(-1);
        }, 10_000);

        return () => {
            if (gameOverTimeoutRef.current) {
                clearTimeout(gameOverTimeoutRef.current);
                gameOverTimeoutRef.current = null;
            }
        };
    }, [stage, navigate]);

    // Render functions to render different stages ("questions, waiting, leaderboard, game over")

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

                        // Feedback styling:
                        //  - After an answer is selected:
                        //      * Correct answer: green
                        //      * Selected wrong answer: red
                        //      * Others: grey outline
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

    // Leaderboard stage shown between questions
    const renderLeaderboard = () => (
        <InfoBox title="Leaderboard">
            <p>
                Your score: <strong>{score}</strong>
            </p>
            <p>
                Current question: {Math.min(currentIndex + 1, questions.length)}{" "}
                / {questions.length}
            </p>

            {/* Full leaderboard pulled from backend */}
            <div style={{ marginTop: 12 }}>
                <h6>Top Users</h6>
                {leaderboard.length > 0 && (
                    <ol style={{ paddingLeft: "1.2rem" }}>
                        {leaderboard.map((p, idx) => (
                            <li
                                key={p.username || idx}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontWeight:
                                        p.username === username
                                            ? "bold"
                                            : "normal",
                                }}
                            >
                                <span>{p.username}</span>
                                <span>{p.score}</span>
                            </li>
                        ))}
                    </ol>
                )}
            </div>
        </InfoBox>
    );

    // Final game over screen (after all questions are done)
    const renderGameOver = () => (
        <InfoBox title="Game Over">
            <p>
                Final score: <strong>{score}</strong>
            </p>

            {/* Final leaderboard */}
            <div style={{ marginTop: 12 }}>
                <h6>Final Leaderboard</h6>
                {leaderboard.length > 0 ? (
                    <ol style={{ paddingLeft: "1.2rem" }}>
                        {leaderboard.map((p, idx) => (
                            <li
                                key={p.username || idx}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontWeight:
                                        p.username === username
                                            ? "bold"
                                            : "normal",
                                }}
                            >
                                <span>{p.username}</span>
                                <span>{p.score}</span>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p>No scores available.</p>
                )}
            </div>

            <div style={{ marginTop: 16 }}>
                <p>Returning to the tournament screen in about 10 seconds…</p>
                <Button variant="primary" onClick={handleReturnToTournament}>
                    Return to Tournament Now
                </Button>
            </div>
        </InfoBox>
    );

    // Main render
    return (
        <>
            {/* Top navigation header */}
            <HeaderBar
                title="Tournaments"
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
                    {stage === "gameover" && renderGameOver()}
                </PullToRefresh>

                {/* Extra space at bottom for the fixed bottom nav */}
                <div style={{ height: "var(--bottom-nav-height, 72px)" }} />
            </ScreenScroll>

            {/* Persistent bottom navigation bar */}
            <BottomNav />
        </>
    );
}
