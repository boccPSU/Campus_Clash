// Shows alerts, can be deleted by clicking red trash icon
import { useState, useId } from "react";
import Spinner from "react-bootstrap/Spinner";

function AlertCard({ alertTitle, alertInfo }) {
    const titleId = useId();
    const [loading, setLoading] = useState(false);

    if (loading) {
        return (
            <div
                className="alertCard"
                tabIndex={0}
                aria-label="Loading alert"
                aria-busy="true"
            >
                <div className="alertBody d-flex justify-content-center">
                    <Spinner
                        animation="border"
                        role="status"
                        className="spinner"
                        aria-label="Loading"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="alertCard" aria-labelledby={titleId} tabIndex={0}>
            <h3 id={titleId} className="alertTitle">
                {alertTitle}
            </h3>
            <p className="alertInfo">{alertInfo}</p>
        </div>
    );
}

export default AlertCard;
