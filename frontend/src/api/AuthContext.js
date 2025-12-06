import { createContext, useContext, useState, useEffect, useRef } from "react";
import {
    loadCourses,
    loadAlerts,
    validateCanvasToken,
} from "./canvas";

import io from "socket.io-client";

const AuthContext = createContext();

export function AuthProvider({ children }) {


    const getToken = () => {
        const tokenString = localStorage.getItem(`token`);
        const userToken = JSON.parse(tokenString);
        console.log("[AUTH] Returning token:", userToken?.token || null);
        return userToken?.token || null;
    };

    const [token, setToken] = useState(getToken);

    const saveToken = (userToken) => {
        //localStorage.clear();
        //sessionStorage.clear();
        localStorage.setItem(`token`, JSON.stringify(userToken));
        sessionStorage.setItem(`token`, JSON.stringify(userToken));
        console.log("[AUTH] Saving token:", userToken.token);

        // NEW CHANGE HERE
        // Clear old student data when token changes
        console.log("[AUTH] Clearing Session on token change");
        sessionStorage.removeItem("studentData");
        sessionStorage.removeItem("userPrefs");
        setStudentData(null);

        setToken(userToken.token);
    };

    const logout = () => {
        localStorage.clear();
        sessionStorage.clear();
        console.log("[AUTH] Logging out, clearing storage and state.");
        setToken(null);
        setUserPrefs(null);
        setStudentData(null);
    };

    const getUserPrefs = () => {
        const userPrefsString = sessionStorage.getItem(`userPrefs`);
        const userPrefs = JSON.parse(userPrefsString);
        console.log("[AUTH] Returning userPrefs:", userPrefs ?? null);
        return userPrefs ?? null;
    };

    const [userPrefs, setUserPrefs] = useState(getUserPrefs);
    const [isLoadingUserPrefs, setLoadingUserPrefs] = useState(false);

    const [isDarkMode, setDarkMode] = useState(userPrefs?.darkMode);

    // Apply/remove class on <body>
    useEffect(() => {
        document.body.classList.toggle("dark-mode", isDarkMode);
    }, [isDarkMode]);

    const saveUserPrefs = (userPrefs) => {
        sessionStorage.setItem(`userPrefs`, JSON.stringify(userPrefs));
        console.log("[AUTH] Saving userPrefs:", userPrefs);
        setDarkMode(userPrefs.darkMode);
        setUserPrefs(userPrefs);
    };

    const loadUserPrefs = async () => {
        if (isLoadingUserPrefs)
            return;
        try {
            setLoadingUserPrefs(true);
            const res = await fetch("http://localhost:5000/api/load-prefs", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "jwt-token": token,
                },
            });

            if (res.status === 500)
                throw new Error("[PREFS] Error",{
                    cause: "Could Not Connect"
                    });

            const {
                darkMode,
                error,
            } = await res.json();
            if (!res.ok) 
                throw new Error("[PREFS] Error", {
                    cause: error
                });

            const newUserPrefs = {
                darkMode: darkMode,
            }

            saveUserPrefs(newUserPrefs);
            setLoadingUserPrefs(false);
        } catch (err) {
            console.error(err);
            setLoadingUserPrefs(false);
            return err;
        }
    };

    const areUserPrefsLoaded = () => {
        if (!userPrefs) 
            return false;

        const requiredKeys = [
            "darkMode",
        ]

        for (const key of requiredKeys) {
            if (!(key in userPrefs))
                return false;
        }

        return true;
    };

    const getStudentData = () => {
        const studentDataString = sessionStorage.getItem(`studentData`);
        const studentData = JSON.parse(studentDataString);
        console.log("[AUTH] Returning studentData:", studentData ?? null);
        return studentData ?? null;
    };

    const [studentData, setStudentData] = useState(getStudentData);

    const saveStudentData = (studentData) => {
        sessionStorage.setItem(`studentData`, JSON.stringify(studentData));
        console.log("[AUTH] Saving studentData:", studentData);
        setStudentData(studentData);
    };

    const [studentDataLoading, setStudentDataLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [coursesLoading, setCoursesLoading] = useState(false);
    const [alertsLoading, setAlertsLoading] = useState(false);
    const [canvasError, setCanvasError] = useState(false);

    // Function to load simple student data (firstName, lastName, username, university, major, xp, gems, canvasToken)
    const loadBasicStudentData = async () => {
        try {
            console.log("[AUTH] Loading basic student data...");
            setStudentDataLoading(true);
            setProfileLoading(true);
            const res = await fetch("http://localhost:5000/api/profile", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "jwt-token": token,
                },
            });

            if (res.status === 500)
                throw new Error("[PROFILE] Error", {
                    cause: "Could not Connect.",
                });
            const { firstName, lastName, username, university, major, xp, gems, canvasToken, error } =
                await res.json();
            if (!res.ok) throw new Error("[PROFILE] Error", { cause: error });

            const newStudentData = {
                firstName: firstName,
                lastName: lastName,
                username: username,
                university: university,
                major: major,
                xp: xp,
                gems: gems,
                canvasToken: canvasToken,
            };
            saveStudentData({
                ...newStudentData,
            });
            setProfileLoading(false);
            setStudentDataLoading(false);
            console.log("[AUTH] Basic student data loaded successfully.");
        } catch (err) {
            console.log(err);
            setStudentDataLoading(false);
            return err;
        }
    }

    const loadStudentData = async () => {
        try {
            console.log("[AUTH] Loading student data...");
            setStudentDataLoading(true);
            setProfileLoading(true);
            setCoursesLoading(true);
            setAlertsLoading(true);
            setCanvasError(false);
            const res = await fetch("http://localhost:5000/api/profile", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "jwt-token": token,
                },
            });
            if (res.status === 500)
                throw new Error("[PROFILE] Error", {
                    cause: "Could not Connect.",
                });
            const {
                firstName,
                lastName,
                username,
                university,
                major,
                xp,
                gems,
                canvasToken,
                error,
            } = await res.json();
            if (!res.ok) throw new Error("[PROFILE] Error", { cause: error });

            const newStudentData = {
                firstName: firstName,
                lastName: lastName,
                username: username,
                university: university,
                major: major,
                xp: xp,
                gems: gems,
                canvasToken: canvasToken,
            };

            if (!validateCanvasToken(token)) {
                setCanvasError(true);
                throw new Error("[PROFILE] Error", {
                    cause: "Invalid Canvas Token",
                });
            }

            saveStudentData({
                ...newStudentData,
            });
            setProfileLoading(false);

            const { courses, gpa, courseError } = await loadCourses(token);
            if (courseError) {
                setCanvasError(true);
                throw new Error("[COURSES] Error", { cause: courseError });
            }
            const courseData = {
                courses: courses,
                gpa: gpa,
            };

            saveStudentData({
                ...newStudentData,
                ...courseData,
            });
            setCoursesLoading(false);

            const { alerts, alertsError } = await loadAlerts(token);
            if (alertsError) {
                setCanvasError(true);
                throw new Error("[ALERTS] Error", { cause: alertsError });
            }

            const alertsData = {
                alerts: alerts,
            };

            saveStudentData({
                ...newStudentData,
                ...courseData,
                ...alertsData,
            });

            setAlertsLoading(false);
            setStudentDataLoading(false);
            console.log("[AUTH] Student data loaded successfully.");
        } catch (err) {
            console.log(err);

            setProfileLoading(false);
            setCoursesLoading(false);
            setAlertsLoading(false);
            setStudentDataLoading(false);

            return err;
        }
    };

    useEffect(() => {
        if (token && !studentDataLoading && !isStudentDataFilled()) {
            console.log(
                "[AUTH] Token changed or student data missing, loading student data."
            );
            loadStudentData();
        }
        if (token && !isLoadingUserPrefs) {
            console.log(
                "[AUTH] Missing User Prefs. Starting load."
            );
            loadUserPrefs();
        }
    }, [token]);

    const isStudentDataFilled = () => {
        const requiredKeys = [
            "firstName",
            "lastName",
            "username",
            "university",
            "major",
            "canvasToken",
            "xp",
            "gems",
            "gpa",
            "courses",
            "alerts",
        ];

        if (!studentData) return false;

        const actualKeys = Object.keys(studentData);

        //Faster check to immediately catch most unfilled data.
        if (requiredKeys.length !== actualKeys.length)
            return false;

        //Better check to ensure studentData has non-null value
        for (const key of requiredKeys) {
            if (!(key in studentData)) {
                console.log("[AUTH] isStudentDataFilled: missing key", key);
                return false;
            }

        }

        return true;
    };

    const [oppFound, setOppFound] = useState(false);
    const [oppData, setOppData] = useState({});

    const socketRef = useRef(null);

    useEffect(() => {
        if (!token || socketRef.current) return ;


        console.log("Creating new Socket Connection");
        socketRef.current = io("http://localhost:5000", {
            auth: { token }
        });

        socketRef.current.on("connect", () => {
            console.log("Connected to Socket");
        });

        socketRef.current.on("battle-found", (payload) => {
            console.log("Battle found!");
            console.log("Opponent: ", payload);
            setOppData(payload);
            setOppFound(true);
        });

        return () => {
            socketRef.current?.disconnect();
            socketRef.current = null;
        }
    }, [token]);

    return (
        <AuthContext.Provider
            value={{
                token,
                setToken: saveToken,
                logout,
                userPrefs,
                isLoadingUserPrefs,
                isDarkMode,
                setDarkMode,
                setUserPrefs: saveUserPrefs,
                areUserPrefsLoaded,
                loadUserPrefs,
                studentData,
                setStudentData: saveStudentData,
                isStudentDataFilled,
                loadStudentData,
                loadBasicStudentData,
                studentDataLoading,
                profileLoading,
                coursesLoading,
                alertsLoading,
                canvasError,
                oppFound,
                oppData,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}


