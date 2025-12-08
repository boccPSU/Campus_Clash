import React, { useEffect, useRef, useState } from "react";
import {Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import InfoTile from "../../newComponents/InfoTile/InfoTile.js";
import HistoryCard from "../../newComponents/HistoryCard/HistoryCard.js";

import { PersonCircle, ChevronRight} from "react-bootstrap-icons";
import BaseScreen from "../BaseScreen/BaseScreen.js";

import {useAuth} from "../../api/AuthContext.js";
import LogoutButton from "../../components/LogoutButton/LogoutButton.js";
import ProfileSettings from "../../newComponents/ProfileSettings/ProfileSettings.js";

function NewProfileScreen() {
    const {studentData, battleHistory, bHistoryLoading} = useAuth();
    const {error, setError} = useState("");

    const history = battleHistory ?? [];

    const visibleHistory = history.slice(0, 3);

    console.log(history);

    return (
        <>
            <BaseScreen>
                <div className="profileContainer">
                    <div className="profileHeader">
                        <div className="profileIcon">
                            <PersonCircle/>
                        </div>
                        <div className="profileHeader-text">
                            <h1 className="profileUsername">
                                {studentData?.username ?? "Scholar"}
                            </h1>
                            <h1 className="profileStudentInfo">
                                {studentData?.university ?? ""}
                            </h1>
                            <h1 className="profileStudentInfo">
                                {studentData?.major ?? ""}
                            </h1>
                        </div>
                    </div>
                    <div className="profileSection">
                        <Button
                            className="btn-label"
                            >
                            <h1 className="profileSectionText">Recent Activity</h1>
                            <ChevronRight/>
                        </Button>

                        <div className="profileRecentActivity">
                            {!bHistoryLoading &&
                            !error &&
                            visibleHistory.map((c, i) => (
                                <InfoTile key={i}>
                                    <HistoryCard {...c} />
                                </InfoTile>
                            ))}
                        </div>
                    </div>
                    <div className="profileSection">
                        <div className="profileSectionTitle">
                            <h1 className="profileSectionText">Settings</h1>
                        </div>
                        <ProfileSettings/>
                    </div>
                    <div className="profileFooter">
                            <LogoutButton/>
                    </div>
                </div>
            </BaseScreen>
        </>
    )
}
export default NewProfileScreen