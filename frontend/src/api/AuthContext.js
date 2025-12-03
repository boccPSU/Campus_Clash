import {createContext, useContext, useState} from 'react'
import { checkRecentSubmissions, loadCourses, loadAlerts} from './canvas';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const getToken = () => {
        const tokenString = localStorage.getItem(`token`);
        const userToken = JSON.parse(tokenString);
        return userToken?.token || null;
    };

    const [token, setToken] = useState(getToken);

    const saveToken = (userToken) => {
        localStorage.setItem(`token`, JSON.stringify(userToken));
        sessionStorage.setItem(`token`, JSON.stringify(userToken));
        setToken(userToken.token);
    };

    const logout = () => {
        localStorage.clear();
        sessionStorage.clear();
        setToken(null);
        setUserPrefs(null);
        setStudentData(null);
    };

    const getUserPrefs = () => {
        const userPrefsString = localStorage.getItem(`userPrefs`);
        const userPrefs = JSON.parse(userPrefsString);
        return userPrefs ?? null;
    }

    const [userPrefs, setUserPrefs] = useState(getUserPrefs);

    const saveUserPrefs = (userPrefs) => {
        localStorage.setItem(`userPrefs`, JSON.stringify(userPrefs));
        setUserPrefs(userPrefs);
    }

    const loadUserPrefs = async () => {

    }

    const areUserPrefsLoaded = () => {

    }

    const getStudentData = () => {
        const studentDataString = sessionStorage.getItem(`studentData`);
        const studentData = JSON.parse(studentDataString);
        return studentData ?? null;
    }

    const [studentData, setStudentData] = useState(getStudentData);

    const saveStudentData = (studentData) => {
        sessionStorage.setItem(`studentData`, JSON.stringify(studentData));
        setStudentData(studentData);
    }

    const loadStudentData = async () => {
        try {
            const res = await fetch("/api/profile", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "jwt-token": token,
                },
            });
            if (res.status === 500) throw new Error("[PROFILE] Error", {cause: "Could not Connect."});
            const newStudentData = await res.json();
            if (!res.ok) throw new Error("[PROFILE] Error", {cause: newStudentData.error});
            
            const {courses, gpa, courseError} = await loadCourses(token);
            if (courseError) throw new Error("[COURSES] Error", {cause: courseError});

            const {alerts, alertsError} = await loadAlerts(token);
            if (alertsError) throw new Error("[ALERTS] Error", {cause: alertsError});
            const submissionData = await checkRecentSubmissions(token);

            const newData = {
                firstName: newStudentData.firstName,
                lastName: newStudentData.lastName,
                username: newStudentData.username,
                university: newStudentData.university,
                major: newStudentData.major,
                xp: newStudentData.xp,
                canvasToken: newStudentData.canvasToken,
                courses: courses,
                gpa: gpa,
                alerts: alerts,
                submissions: submissionData
            };

            saveStudentData(newData);

        } catch (err) {
            console.log(err);
            return err;
        }
    }

    const isStudentDataFilled = () => {
        const requiredKeys = [
            "firstName",
            "lastName",
            "username",
            "university",
            "major",
            "canvasToken",
            "xp",
            "gpa",
            "courses",
            "alerts",
            "submissions"
        ];

        if (!studentData) 
            return false;
        

        const actualKeys = Object.keys(studentData);

        if (requiredKeys.length !== actualKeys.length)
            return false;

        for (const keys of requiredKeys) {
            if (!studentData[keys]) 
                return false;
            
        }
    }

    return (
        <AuthContext.Provider value={{ token, setToken: saveToken, logout, userPrefs, setUserPrefs: saveUserPrefs, areUserPrefsLoaded, loadUserPrefs, studentData, setStudentData: saveStudentData, isStudentDataFilled, loadStudentData}}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}