import React from "react";

// import routing tools to switch between pages
import {Routes, Route, useLocation} from "react-router-dom";
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
import QuestionScreen from "./screens/QuestionScreen";
import useToken from "./api/userTokens";
import QuestionTester from "./screens/QuestionTester";

function App() {
    const {token, setToken} = useToken();
    const location = useLocation();

    const [pathName, setPathName] = useState(location.pathname);

    useEffect(() => {
        if (!token && !(location.pathname === "/register")) {
            setPathName("/login");
        } else {
            setPathName(location.pathname);
        }
    }, [location]);

    return (
            <Routes location={pathName}>
                {/* default path -> Home */}
                <Route path="/" element={<HomeScreen />} />

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

                <Route path="/test" element = {<QuestionTester></QuestionTester>}></Route>
                {/* /questions -> Tournament Questions*/}
                <Route path="/questions" element = {<QuestionScreen></QuestionScreen>}></Route>
            </Routes>
    );
}

export default App;
