import React from 'react';
import { PersonCircle} from "react-bootstrap-icons";

import "./ProfileInfo.scss";

function ProfileInfo({user}) {

    return (
        <div className="profile">
            <PersonCircle
                className="profileIcon"
                aria-label="Profile"
                role="img"
                style={{width:"60%", height:"60%"}}
            />
            <h1 className="infoText">{user?.username}</h1>
            <h3 className="infoText">XP: {user?.xp}</h3>
        </div>
    );
}

export default ProfileInfo;