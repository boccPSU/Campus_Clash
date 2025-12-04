import React, { useEffect, useRef, useState } from "react";
import {Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import InfoTile from "../../newComponents/InfoTile/InfoTile.js";

import { ChevronDown, ChevronUp, PersonCircle, ChevronRight} from "react-bootstrap-icons";
import BaseScreen from "../BaseScreen/BaseScreen.js";

import {useAuth} from "../../api/AuthContext.js";

import './NewProfileScreen.scss';

function NewProfileScreen() {
    const {studentData} = useAuth();

    const [isDarkMode, setIsDarkMode] = useState(false);

    // Toggle dark mode on "d" / "D"
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key && e.key.toLowerCase() === "d") {
                setIsDarkMode((prev) => !prev);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Apply/remove class on <body>
    useEffect(() => {
        document.body.classList.toggle("dark-mode", isDarkMode);
    }, [isDarkMode]);



    return (
        <>
            <BaseScreen>
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
                <Button
                    className="btn-label"
                    >
                    <h1 className="profileSectionTitle">Recent Activity</h1>
                    <ChevronRight/>
                </Button>

                <div className="profileRecentActivity">
                    
                </div>
            </BaseScreen>
        </>
    )
}
export default NewProfileScreen