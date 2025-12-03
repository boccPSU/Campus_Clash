import {createContext, useContext, useState, useEffect} from 'react'

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
    };

    return (
        <AuthContext.Provider value={{ token, setToken: saveToken, logout}}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}