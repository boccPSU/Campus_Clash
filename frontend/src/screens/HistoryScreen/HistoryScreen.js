import React, { useEffect, useRef, useState } from "react";
import {Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import InfoTile from "../../newComponents/InfoTile/InfoTile.js";
import HistoryCard from "../../newComponents/HistoryCard/HistoryCard.js";

import { PersonCircle, ChevronLeft} from "react-bootstrap-icons";
import BaseScreen from "../BaseScreen/BaseScreen.js";

import {useAuth} from "../../api/AuthContext.js";
import LogoutButton from "../../components/LogoutButton/LogoutButton.js";
import ProfileSettings from "../../newComponents/ProfileSettings/ProfileSettings.js";

function NewProfileScreen() {
    const {battleHistory, bHistoryLoading} = useAuth();
    const {error, setError} = useState("");

    const navigate = useNavigate();

    const history = battleHistory ?? [];

    const visibleHistory = history.slice(0, 3);

    console.log(history);

    return (
        <>
            <BaseScreen>
                    <div className="history-ctnr">
                        <div className="history-header">
                            <Button
                                className="btn-history-back"
                                onClick={() => {
                                    navigate("/profile");
                                }}
                                >
                                <ChevronLeft/>
                            </Button>

                            <h1 className="history-title">Recent Activity</h1>
                        </div>

                        <div className="history-list">
                            {!bHistoryLoading &&
                            !error &&
                            visibleHistory.map((c, i) => (
                                <InfoTile key={i}>
                                    <HistoryCard {...c} />
                                </InfoTile>
                            ))}
                        </div>
                    </div>
            </BaseScreen>
        </>
    )
}
export default NewProfileScreen