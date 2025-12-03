import React from 'react';
import {Button} from 'react-bootstrap';
import './LogoutButton.scss';

function LogoutButton({handleLogout}) {

    return (
        <Button
            aria-label="logout-button"
            className="logoutButton"
            onClick={handleLogout}>
            Log Out
        </Button>
    );
}
export default LogoutButton;