import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function PrivateRoute({ children }) {
    const { token } = useAuth();

    // If token does not exist, send user to login page
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
}