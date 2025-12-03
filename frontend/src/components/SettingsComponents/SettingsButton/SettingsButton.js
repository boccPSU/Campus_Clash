import {Button} from "react-bootstrap";
import { useNavigate, useLocation} from "react-router-dom";
import {Gear} from "react-bootstrap-icons";
import './SettingsButton.scss';

function SettingsButton() {

    const navigate = useNavigate();
    const location = useLocation();

    return (
            <Button 
                aria-label="settings-button"
                className="settingsButton"
                onClick={() => {navigate("/settings",{
                    state: {
                        returnPath: location.pathname
                    }})
                }}>
                Settings {' '}
                <Gear></Gear>
            </Button>
    );
}
export default SettingsButton;