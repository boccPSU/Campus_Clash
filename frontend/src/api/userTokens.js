import {useState} from 'react'

const useToken = () => {
    const getToken = () => {
        const tokenString = localStorage.getItem('token');
        const userToken = JSON.parse(tokenString);
        console.log("(GET) Token: ", userToken);
        return userToken?.token;
    }
    
    const [token, setToken] = useState(getToken());
    const saveToken = userToken => {
        console.log("(SET) Token: ", userToken);
        console.log("JSON: ", JSON.stringify(userToken));
        localStorage.setItem('token', JSON.stringify(userToken));
        sessionStorage.setItem('token', JSON.stringify(userToken));
        setToken(userToken.token);
    }

    const logout = () => {
        localStorage.clear();
        sessionStorage.clear();
        setToken(null);
    }

    return {
        setToken: saveToken,
        token,
        logout
    }
}

export default useToken;