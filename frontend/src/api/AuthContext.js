import { createContext, useContext, useState, useEffect } from "react";
import {
    loadCourses,
    loadAlerts,
    validateCanvasToken,
} from "./canvas";

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
        console.log("[AUTH] Clearing studentData on token change");
        sessionStorage.removeItem("studentData");
        localStorage.removeItem("studentData");
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
        const userPrefsString = localStorage.getItem(`userPrefs`);
        const userPrefs = JSON.parse(userPrefsString);
        console.log("[AUTH] Returning userPrefs:", userPrefs ?? null);
        return userPrefs ?? null;
    };

    const [userPrefs, setUserPrefs] = useState(getUserPrefs);

    const saveUserPrefs = (userPrefs) => {
        localStorage.setItem(`userPrefs`, JSON.stringify(userPrefs));
        console.log("[AUTH] Saving userPrefs:", userPrefs);
        setUserPrefs(userPrefs);
    };

    const loadUserPrefs = async () => {};

    const areUserPrefsLoaded = () => {};

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

            // Changing this to null const submissionData = await checkRecentSubmissions(token);
            const submissionData = null;
            saveStudentData({
                ...newStudentData,
                ...courseData,
                ...alertsData,
                submissions: submissionData,
            });

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
            "submissions",
        ];

        if (!studentData) return false;

        
        // Better check for keys, not relying on length
        for (const key of requiredKeys) {
            if (!(key in studentData)) {
                console.log("[AUTH] isStudentDataFilled: missing key", key);
                return false;
            }

        }

        return true;
    };

    return (
        <AuthContext.Provider
            value={{
                token,
                setToken: saveToken,
                logout,
                userPrefs,
                setUserPrefs: saveUserPrefs,
                areUserPrefsLoaded,
                loadUserPrefs,
                studentData,
                setStudentData: saveStudentData,
                isStudentDataFilled,
                loadStudentData,
                studentDataLoading,
                profileLoading,
                coursesLoading,
                alertsLoading,
                canvasError,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
