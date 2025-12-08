import React, {useState, useEffect} from "react";
import {Button, ProgressBar, Spinner} from "react-bootstrap";
import {PersonCircle, Plus, Dash, LightningFill, QuestionCircle} from "react-bootstrap-icons";

import BaseScreen from "../BaseScreen/BaseScreen";

import { useAuth } from "../../api/AuthContext";

function BattleScreen() {

    const {token, studentData, battleFound, battleData} = useAuth();
    const [isLoading, setLoading] = useState(false);

    const [opponentData, setOpponentData] = useState({});
    const [rewardData, setRewardData] = useState(0);
    const [timer, setTimer] = useState(0);

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
            if (!battleFound)
                setPage("looking");
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

    useEffect(() => {
        console.log("Battle Found Changed Values: ", battleFound);
        if (battleFound) {
            console.log(battleData);
            setPage("found");
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
                    <h1 className="timer">{"00:01:58"}</h1>
                </div>
                <div className="participants-container">
                    <div className="profile-container">
                        <div className="icon">
                            <PersonCircle/>
                        </div>
                        
                        <h1 className="username">{battleData?.username1 || "Scholar"}</h1>
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
                        <h1 className="username">{battleData?.username2 || "Opponent"}</h1>
                        <div className="xp-container">
                            <h1 className="xp-gained">XP Gained:</h1>
                            <h1 className="xp-gained">{"0"}</h1>
                        </div>
                    </div>
                </div>
                <div className="compare-xp-container">
                    <ProgressBar
                        className="compare-xp-progress-bar"
                        now={50}
                    />
                </div>
                <div className="rewards-container">
                    <h1 className="title">Rewards</h1>
                    <h1 className="amount">1000 Gems</h1>
                    <div className="wager-container">
                        <h1 className="payout">+ {0} Gems</h1>
                        <div className="selectGems">
                            <div className="btn-switch-container">
                                <Button
                                    className="btn-switch"
                                >
                                    <Dash/>
                                </Button>
                                <div className="switch-gap"></div>
                            </div>
                            <h1 className="gemAmount">{0}</h1>
                            <div className="btn-switch-container">
                                <div className="switch-gap"></div>
                                <Button
                                    className="btn-switch"
                                >
                                    <Plus/>
                                </Button>
                            </div>
                        </div>
                        <Button

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

    return (
        <BaseScreen>
            {renderPage()}
        </BaseScreen>
    );
}
export default BattleScreen