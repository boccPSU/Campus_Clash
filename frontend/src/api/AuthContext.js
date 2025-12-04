import {createContext, useContext, useState, useEffect} from 'react'
import { checkRecentSubmissions, loadCourses, loadAlerts, validateCanvasToken} from './canvas';

const AuthContext = createContext();

export function AuthProvider({ children }) {

    const getToken = () => {
        const tokenString = localStorage.getItem(`token`);
        const userToken = JSON.parse(tokenString);
        return userToken?.token || null;
    };

    const [token, setToken] = useState(getToken);

    const saveToken = (userToken) => {
        //localStorage.clear();
        //sessionStorage.clear();
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

    const [studentDataLoading, setStudentDataLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [coursesLoading, setCoursesLoading] = useState(false);
    const [alertsLoading, setAlertsLoading] = useState(false);
    const [canvasError, setCanvasError] = useState(false);

    const loadStudentData = async () => {
        try {
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
            if (res.status === 500) throw new Error("[PROFILE] Error", {cause: "Could not Connect."});
            const {firstName, 
                    lastName,
                    username,
                    university,
                    major,
                    xp,
                    canvasToken,
                    error
            } = await res.json();
            if (!res.ok) throw new Error("[PROFILE] Error", {cause: error});

            const newStudentData = {
                firstName: firstName,
                lastName: lastName,
                username: username,
                university: university,
                major: major,
                xp: xp,
                canvasToken: canvasToken
            };

            if (!validateCanvasToken(token)) {
                setCanvasError(true);
                throw new Error("[PROFILE] Error", {cause: "Invalid Canvas Token"});
            }

            saveStudentData({
                ...newStudentData
            })
            setProfileLoading(false);
            
            const {courses, gpa, courseError} = await loadCourses(token);
            if (courseError) {
                setCanvasError(true);
                throw new Error("[COURSES] Error", {cause: courseError});
            }
            const courseData = {
                courses: courses,
                gpa: gpa
            }

            saveStudentData({
                ...newStudentData,
                ...courseData
            });
            setCoursesLoading(false);

            const {alerts, alertsError} = await loadAlerts(token);
            if (alertsError) {
                setCanvasError(true);
                throw new Error("[ALERTS] Error", {cause: alertsError});
            }

            const alertsData = {
                alerts: alerts
            };

            saveStudentData({
                ...newStudentData,
                ...courseData,
                ...alertsData
            });

            setAlertsLoading(false);

            const submissionData = await checkRecentSubmissions(token);

            saveStudentData({
                ...newStudentData,
                ...courseData,
                ...alertsData,
                submissions: submissionData
            });

            setStudentDataLoading(false);

        } catch (err) {
            console.log(err);

            setProfileLoading(false);
            setCoursesLoading(false);
            setAlertsLoading(false);
            setStudentDataLoading(false);

            return err;
        }
    }

    useEffect(() => {
        if (token && !studentDataLoading && !isStudentDataFilled()) {
            console.log("Initial Load");
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
        <AuthContext.Provider value={{ token, setToken: saveToken, logout, userPrefs, setUserPrefs: saveUserPrefs, areUserPrefsLoaded, loadUserPrefs, studentData, setStudentData: saveStudentData, isStudentDataFilled, loadStudentData, studentDataLoading, profileLoading, coursesLoading, alertsLoading, canvasError}}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}