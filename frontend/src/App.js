import React from "react";

// import routing tools to switch between pages
import {Routes, Route, Navigate} from "react-router-dom";

// needed to use bootstrap components
//import "bootstrap/dist/css/bootstrap.min.css";
// New components
import NewHomeScreen from "./screens/NewHomeScreen/newHomeScreen";

// import all currently finished screens
import HomeScreen from "./screens/HomeScreen";
import EventsScreen from "./screens/EventsScreen";
import LeaderboardScreen from "./screens/LeaderboardScreen";
import TournamentScreen from "./screens/TournamentScreen";
import StudyPlan from "./screens/StudyPlan";
import ProgressReport from "./screens/ProgressReport";
import RegisterScreen from "./screens/RegisterScreen";
import LoginScreen from "./screens/LoginScreen";
import ProfileScreen from "./screens/ProfileScreen/ProfileScreen";
import QuestionScreen from "./screens/QuestionScreen";
import QuestionTester from "./screens/QuestionTester";
import SettingsScreen from "./screens/SettingsScreen";

import {AuthProvider} from "./api/AuthContext";
import PrivateRoute from "./api/PrivateRoute";
import NewTournamentScreen from "./screens/NewTournamentScreen/NewTournamentScreen";
import NewQuestionScreen from "./screens/NewQuestionScreen/NewQuestionScreen";
import NewLeaderboardScreen from "./screens/NewLeaderboardScreen/NewLeaderboardScreen";

import NewProfileScreen from "./screens/NewProfileScreen/NewProfileScreen";

function App() {

    return (
        <AuthProvider>
            <Routes>
                {/* default path redirects depending on token*/}
                <Route path="/" element={<Navigate to={"/home"} replace />}/>
                
                {/* /home path -> Home */}
                <Route path="/home" element={
                    <PrivateRoute>
                        <NewHomeScreen />
                    </PrivateRoute>
                    } />

                {/* /events path -> Events screen */}
                <Route path="/events" element={
                    <PrivateRoute>
                        <EventsScreen />
                    </PrivateRoute>
                    } />

                {/* /tournaments path -> Tournament screen */}
                <Route path="/tournament" element={
                    <PrivateRoute>
                        <NewTournamentScreen />
                    </PrivateRoute>
                    } />

                {/* /leaderboard path -> Leaderboard screen */}
                <Route path="/leaderboard" element={
                    <PrivateRoute>
                        <NewLeaderboardScreen />
                    </PrivateRoute>} />

                {/* /studyPlan -> Study Plan screen */}
                <Route path="/studyPlan" element={
                    <PrivateRoute>
                        <StudyPlan />
                    </PrivateRoute>
                    } />

                {/* /progressReport -> Study Plan screen */}
                <Route path="/progressReport" element={
                    <PrivateRoute>
                        <ProgressReport />
                    </PrivateRoute>
                    } />
                
                {/* /register -> Register screen*/}
                <Route path="/register" element={<RegisterScreen />} />

                {/* /login -> Login screen*/}
                <Route path="/login" element={<LoginScreen />} />

                {/* /profile -> Profile Screen*/}
                <Route path="/profile" element={
                    <PrivateRoute>
                        <NewProfileScreen />
                    </PrivateRoute>
                    } />

                <Route path="/test" element = {
                    <PrivateRoute>
                        <QuestionTester/>
                    </PrivateRoute>
                    }/>
                {/* /questions -> Tournament Questions*/}
                <Route path="/questions" element = {<NewQuestionScreen />}></Route>
            </Routes>
        </AuthProvider>
    );
}

export default App;
