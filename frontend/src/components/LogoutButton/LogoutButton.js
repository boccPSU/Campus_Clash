import React from 'react';
import {Button} from 'react-bootstrap';
import {useAuth} from "../../api/AuthContext";

function LogoutButton() {

    const {logout} = useAuth();

    return (
        <Button
            aria-label="Logout"
            className="btn-logout"
            onClick={logout}>
            Log Out
        </Button>
    );
}
export default LogoutButton;