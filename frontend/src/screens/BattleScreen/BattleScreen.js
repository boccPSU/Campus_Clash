import React, {useState, useEffect, useRef} from "react";
import {Button, ProgressBar, Spinner} from "react-bootstrap";
import {PersonCircle, Plus, Dash, LightningFill, QuestionCircle} from "react-bootstrap-icons";

import BaseScreen from "../BaseScreen/BaseScreen";

import { useAuth } from "../../api/AuthContext";

function BattleScreen() {

    const {token, studentData, battleFound, battleData, socketRef} = useAuth();
    const [isLoading, setLoading] = useState(false);
    const [wagerAmount, setWagerAmount] = useState(0);

    const battleFoundRef = useRef(battleFound);

    const  handleKeyDown = (b) => {
        console.log("B Key");
        if (battleFound)
            console.log("Ending Battle");
            fetch("http://localhost:5000/api/force-end-battle", {
                headers: {
                    "Content-Type": "applcation/json",
                    "jwt-token": token
                }
            });
    };

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [])

    useEffect(() => {
        if (isLoading) {
            setPage("loading");
        }
    }, [isLoading]);
    //States are loading, search, looking, found, results
    const [page, setPage] = useState("search");

    const initialLoad = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/load-battle", {
                method: "get",
                headers: {
                    "Content-Type": "application/json",
                    "jwt-token": token,
                }
            });
            if (res.status === 500) 
                throw new Error("[BATTLE] Error", {cause: "Could not connect."});
            const data = await res.json();
            if (!res.ok)
                throw new Error("[BATTLE] Error", {cause: data.error});

            const {
                successful,
            } = data;

            if (!successful) {
                setPage("search");
                return;
            }

        } catch (err) {

        }
    }

    useEffect(() => {
        if (!battleFound) {
            initialLoad();
        } else {
            setPage("found");
        }
    }, []);

    const beginSearch = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/find-battle", {
                method: "get",
                headers: {
                    "Content-Type": "application/json",
                    "jwt-token": token,
                }
            });
            console.log("[BATTLE] Response Received: ", res);
            if (res.status === 500) 
                throw new Error("[BATTLE] Error", {cause: "Could not connect."});
            const data = await res.json();
            if (!res.ok)
                throw new Error("[BATTLE] Error", {cause: data.error});
            if (!battleFoundRef.current) {
                console.log("Opponent not found.");
                setPage("looking");
            }
        } catch (err) {
            console.error(err);
            setPage("search");
        }
    }

    const cancelSearch = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:5000/api/cancel-battle-request", {
                headers: {
                    "Content-Type": "application/json",
                    "jwt-token": token
                }
            });
            if (res.status === 500) 
                throw new Error("[BATTLE] Error", {cause: "Could not connect."});
            const data = await res.json();
            if (!res.ok)
                throw new Error("[BATTLE] Error", {cause: data.error});
            if (data.successful) {
                setPage("search");
            } else {
                setPage("found");
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setPage("looking");
            setLoading(false);
        }
    }

    const addWager = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/add-wager", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "jwt-token": token
                },
                body: JSON.stringify({gems: wagerAmount})
            });
            if (res.status === 500) 
                throw new Error("[BATTLE] Error", {cause: "Could not connect."});
            const data = await res.json();
            if (!res.ok)
                throw new Error("[BATTLE] Error", {cause: data.error});
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        console.log("Battle Found Changed Values: ", battleFound);
        battleFoundRef.current = battleFound;
        if (battleFound) {
            setPage("found");
        } else {
            initialLoad();
        }
    }, [battleFound]);

    const renderPage = () => {
        if (page === "loading") {
            return (
                <div className="battle-container">
                    <div className="battle-loading">
                        <Spinner/>
                        <h1 className="btl-loading-txt">Loading...</h1>
                    </div>
                </div>
            );
        } else if (page === "search") {
            return (
                <div className="battle-container">
                    <div className="battle-header">
                        <h1 className="title">Battle</h1>
                        <h1 className="description">Compete with other students to earn gems! Whoever earns more XP in one week will be declared the winner.</h1>
                    </div>

                    <div className="find-battle-container">
                        <Button
                            className="btn-find-battle"
                            onClick={beginSearch}>
                                Find Battle
                                <LightningFill/>
                            </Button>
                    </div>
                </div>
            );
        } else if (page === "looking") {
            return (
                <div className="battle-container">
                    <div className="battle-header">
                        <h1 className="title">Battle</h1>
                        <h1 className="description">We'll notify you when your match starts.</h1>
                    </div>
                    <div className="participants-container">
                        <div className="profile-container">
                            <div className="icon">
                                <PersonCircle/>
                            </div>
                            
                            <h1 className="username">{"Scholar"}</h1>
                            <div className="xp-container">
                                <h1 className="xp-gained">XP Gained:</h1>
                                <h1 className="xp-gained">{}</h1>
                            </div>
                        </div>
                        <h1>vs.</h1>
                        <div className="profile-container">
                            <div className="icon">
                                <QuestionCircle/>
                            </div>
                            <h1 className="username">{"Unknown"}</h1>
                            <div className="xp-container">
                                <h1 className="xp-gained">XP Gained: </h1>
                                <h1 className="xp-gained">{}</h1>
                            </div>
                        </div>
                    </div>
                    <div className="find-battle-container">
                        <Button
                            className="btn-cancel-btl"
                            onClick={cancelSearch}>
                                Cancel
                        </Button>
                    </div>
                </div>
            );
        } else if (page === "found") {
            return (
                <div className="battle-container">
                <div className="battle-header">
                    <h1 className="title">Battle</h1>
                    <h1 className="timer">Ends on: {battleData?.end_date}</h1>
                </div>
                <div className="participants-container">
                    <div className="profile-container">
                        <div className="icon">
                            <PersonCircle/>
                        </div>
                        
                        <h1 className="username">{battleData?.username1 || "Scholar"}</h1>
                        <div className="xp-container">
                            <h1 className="xp-gained">XP Gained:</h1>
                            <h1 className="xp-gained">{battleData?.xp_gained_p1 || 0}</h1>
                        </div>
                    </div>
                    <h1>vs.</h1>
                    <div className="profile-container">
                        <div className="icon">
                            <PersonCircle/>
                        </div>
                        <h1 className="username">{battleData?.username2 || "Opponent"}</h1>
                        <div className="xp-container">
                            <h1 className="xp-gained">XP Gained:</h1>
                            <h1 className="xp-gained">{battleData?.xp_gained_p2 || 0}</h1>
                        </div>
                    </div>
                </div>
                <div className="compare-xp-container">
                    <ProgressBar
                        className="compare-xp-progress-bar"
                        now={(100 * battleData?.xp_gained_p1) / (battleData?.xp_gained_p1 + battleData?.xp_gained_p2)}
                    />
                </div>
                <div className="rewards-container">
                    <h1 className="title">Rewards</h1>
                    <h1 className="amount">{battleData?.reward} Gems</h1>
                    <div className="wager-container">
                        <h1 className="payout">+ {2 * wagerAmount} Gems</h1>
                        <div className="selectGems">
                            <div className="btn-switch-container">
                                <Button
                                    className="btn-switch"
                                    onClick={() => {
                                        newWager(wagerAmount - 50);
                                    }}
                                >
                                    <Dash/>
                                </Button>
                                <div className="switch-gap"></div>
                            </div>
                            <h1 className="gemAmount">{wagerAmount}</h1>
                            <div className="btn-switch-container">
                                <div className="switch-gap"></div>
                                <Button
                                    className="btn-switch"
                                    onClick={() => {
                                        newWager(wagerAmount + 50);
                                    }}
                                >
                                    <Plus/>
                                </Button>
                            </div>
                        </div>
                        <Button
                            onClick={() => {
                                if (wagerAmount > 0) {
                                    addWager();
                                    setWagerAmount(0);
                                }
                            }}
                        >
                            Confirm
                        </Button>
                    </div>
                </div>
            </div>
            );
        } else if (page === "results") {
            return (
                <div className="battle-container">
                    <div className="battle-header">
                        <h1 className="title">Final Results</h1>
                    </div>
                    <div className="participants-container">
                        <div className="profile-container">
                            <div className="icon">
                                <PersonCircle/>
                            </div>
                            
                            <h1 className="username">{"Scholar"}</h1>
                            <div className="xp-container">
                                <h1 className="xp-gained">XP Gained:</h1>
                                <h1 className="xp-gained">{"0"}</h1>
                            </div>
                        </div>
                        <h1>vs.</h1>
                        <div className="profile-container">
                            <div className="icon">
                                <PersonCircle/>
                            </div>
                            <h1 className="username">{"Opponent"}</h1>
                            <div className="xp-container">
                                <h1 className="xp-gained">XP Gained:</h1>
                                <h1 className="xp-gained">{"0"}</h1>
                            </div>
                        </div>
                    </div>
                    <div className="compare-xp-container">
                        <ProgressBar
                            className="compare-xp-progress-bar"
                            now={100}
                        />
                    </div>
                    <div className="rewards-container">
                        <h1 className="title">{"You Win!"}</h1>
                        <h1 className="amount">Reward: 1000 Gems</h1>
                    </div>
                    <div className="battle-retry-container">
                        <Button
                            className="btn-close-btl"
                        >
                            Close
                        </Button>
                        <Button
                            className="btn-again-btl"
                        >
                            Find Match
                        </Button>
                    </div>
                </div>
            );
        }
    }

    const newWager = (newAmount) => {
        //Sets Wager to minimum of 0 or maximum of the gems in account
        setWagerAmount(newAmount >= 0 ? newAmount <= studentData.gems ? newAmount : studentData.gems : 0);
    }

    return (
        <BaseScreen>
            {renderPage()}
        </BaseScreen>
    );
}
export default BattleScreen