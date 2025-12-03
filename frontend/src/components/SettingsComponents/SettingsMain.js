import {Button} from "react-bootstrap";
import {PersonCircle, ArrowRight, Gear} from "react-bootstrap-icons";

import "./Settings.scss";

function SettingsMain({setPage}) {

    const toProfileSettings = () => {
        setPage(1);
    }

    const toNotificationSettings = () => {
        setPage(2)
    }

    return (
        <div className="settingsMain">
            <Button 
                className="navButton"
                onClick={toProfileSettings}
            >
                <PersonCircle></PersonCircle>
                Profile
                <ArrowRight></ArrowRight>
            </Button>
            <Button 
                className="navButton"
                onClick={toNotificationSettings}
            >
                <Gear></Gear>
                Notifications
                <ArrowRight></ArrowRight>    
            </Button>
        </div>
    )
}
export default SettingsMain;