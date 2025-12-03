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
import ProfileScreen from "./screens/ProfileScreen/ProfileScreen";
import QuestionScreen from "./screens/QuestionScreen";
import QuestionTester from "./screens/QuestionTester";
import SettingsScreen from "./screens/SettingsScreen";

import {AuthProvider, useAuth} from "./api/AuthContext"
import PrivateRoute from "./api/PrivateRoute";

function App() {

    return (
        <AuthProvider>
            <Routes>
                {/* default path redirects depending on token*/}
                <Route path="/" element={<Navigate to={"/home"} replace />}/>
                
                {/* /home path -> Home */}
                <Route path="/home" element={
                    <PrivateRoute>
                        <HomeScreen />
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
                        <TournamentScreen />
                    </PrivateRoute>
                    } />

                {/* /leaderboard path -> Leaderboard screen */}
                <Route path="/leaderboard" element={
                    <PrivateRoute>
                        <LeaderboardScreen />
                    </PrivateRoute>
                    } />

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
                        <ProfileScreen />
                    </PrivateRoute>
                    } />

                <Route path="/test" element = {
                    <PrivateRoute>
                        <QuestionTester/>
                    </PrivateRoute>
                    }/>
                {/* /questions -> Tournament Questions*/}
                <Route path="/questions" element = {
                    <PrivateRoute>
                        <QuestionScreen/>
                    </PrivateRoute>
                    }/>

                {/* /settings -> Settings Screen*/}
                <Route path="/settings" element = {
                    <PrivateRoute>
                        <SettingsScreen/>
                    </PrivateRoute>
                    }/>
            </Routes>
        </AuthProvider>
    );
}

export default App;
