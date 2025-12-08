// src/newComponents/MainPopup/MainPopup.js
import React, { useEffect } from "react";
import "./MainPopup.scss";
import {
    ExclamationTriangleFill,
    StarFill
} from "react-bootstrap-icons";

function MainPopup({
    open,
    title,
    message,
    buttonLabel1,
    buttonLabel2,
    onButton1,
    onButton2,
    onClose,
    children,
    type
}) {
    useEffect(() => {
        function handleKeyDown(e) {
            if (!open) return;
            if (e.key === "Escape" && onClose) {
                onClose();
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="mainPopup-backdrop"
            onClick={(e) => {
                if (e.target === e.currentTarget && onClose) {
                    onClose();
                }
            }}
        >
            <div className="mainPopup-card">
                <button
                    type="button"
                    className="mainPopup-close"
                    onClick={onClose}
                >
                    ✕
                </button>

                <div className="mainPopup-iconWrapper">
                    {type === "levelUp" ? (
                        <StarFill className="starIcon" />
                    ) : type === "alert" ? (
                        <ExclamationTriangleFill className="mainPopup-icon" />
                    ) : <></>}
                </div>

                {title && <h2 className="mainPopup-title">{title}</h2>}

                {message && !children && (
                    <p className="mainPopup-message">{message}</p>
                )}

                {children && (
                    <div className="mainPopup-children">
                        {children}
                    </div>
                )}

                {/* Only show buttons for non-levelUp popups (e.g., alerts) */}
                {type === "alert" && (
                    <div className="mainPopup-actions">
                        <button
                            type="button"
                            className="mainPopup-btn mainPopup-btn-primary"
                            onClick={onButton1}
                        >
                            {buttonLabel1}
                        </button>

                        <button
                            type="button"
                            className="mainPopup-btn mainPopup-btn-secondary"
                            onClick={onButton2}
                        >
                            {buttonLabel2}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MainPopup;
