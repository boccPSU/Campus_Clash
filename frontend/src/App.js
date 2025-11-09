import React from "react";

// import routing tools to switch between pages
import {Routes, Route, useLocation, useNavigate, Navigate} from "react-router-dom";
import {useEffect, useState} from 'react';

// needed to use bootstrap components
//import "bootstrap/dist/css/bootstrap.min.css";

// import all currently finished screens
import HomeScreen from "./screens/HomeScreen";
import EventsScreen from "./screens/EventsScreen";
import LeaderboardScreen from "./screens/LeaderboardScreen";
import TournamentScreen from "./screens/TournamentScreen";
import StudyPlan from "./screens/StudyPlan";
import ProgressReport from "./screens/ProgressReport";
import RegisterScreen from "./screens/RegisterScreen";
import LoginScreen from "./screens/LoginScreen";
import ProfileScreen from "./screens/ProfileScreen";
import QuestionScreen from "./screens/QuestionScreen";
import useToken from "./api/userTokens";
import QuestionTester from "./screens/QuestionTester";

function App() {
    const {token, setToken} = useToken();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!token && (location.pathname !== "/register") && (location.pathname !== "/login")) {
            navigate("/login");
        }
    }, [location]);

    return (
            <Routes>
                {/* default path redirects depending on token*/}
                <Route path="/" element={<Navigate to={token ? "/home" : "/login"} replace />}/>
                
                {/* /home path -> Home */}
                <Route path="/home" element={<HomeScreen />} />

                {/* /events path -> Events screen */}
                <Route path="/events" element={<EventsScreen />} />

                {/* /tournaments path -> Tournament screen */}
                <Route path="/tournament" element={<TournamentScreen />} />

                {/* /leaderboard path -> Leaderboard screen */}
                <Route path="/leaderboard" element={<LeaderboardScreen />} />

                {/* /studyPlan -> Study Plan screen */}
                <Route path="/studyPlan" element={<StudyPlan />} />

                {/* /progressReport -> Study Plan screen */}
                <Route path="/progressReport" element={<ProgressReport />} />
                
                {/* /register -> Register screen*/}
                <Route path="/register" element={<RegisterScreen setToken={setToken} />} />

                {/* /login -> Login screen*/}
                <Route path="/login" element={<LoginScreen setToken={setToken}/>} />

                {/* /profile -> Profile Screen*/}
                <Route path="/profile" element={<ProfileScreen/>} />

                <Route path="/test" element = {<QuestionTester></QuestionTester>}></Route>
                {/* /questions -> Tournament Questions*/}
                <Route path="/questions" element = {<QuestionScreen></QuestionScreen>}></Route>
            </Routes>
    );
}

export default App;
