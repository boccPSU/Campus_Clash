import {useState, useEffect} from "react";
import {Button, Row, Col, Form} from "react-bootstrap";
import {ChevronLeft, ChevronRight, Pencil, X} from "react-bootstrap-icons";

import SettingsEditWindow from "./SettingsEditWindow";

import { useAuth } from "../../api/AuthContext";
import InfoTile from "../InfoTile/InfoTile";

const Modal = ({children, onClose }) => {
    return (
        <>
            <div className="backdrop" onClick={onClose}></div>

            <div className="modalMain">
                <Button 
                    className="btn-close"
                    onClick={onClose}
                    >
                    <X/>
                </Button>
                {children}
            </div>
        </>
    );
};

function ProfileSettings() {
    const {studentData, token, userPrefs, setUserPrefs} = useAuth();

    const [page, setPage] = useState(0)
    const [isModalOpen, setModalOpen] = useState(false);
    const [fieldState, setFieldState] = useState(0);

    const onSwitch = (checked) => {
        const newUserPrefs = {
            ...userPrefs,
            darkMode: checked
        };
        setUserPrefs(newUserPrefs);
        try {
            fetch("http://localhost:5000/api/update-prefs", {
                method: "post",
                headers: {
                    "Content-Type": "application/json",
                    "jwt-token": token
                },
                body: JSON.stringify(newUserPrefs),
            });
        } catch (err) {
            console.error("[SAVE-PREFS] Error: ", err);
        }
    }

    console.log(userPrefs);
    console.log(userPrefs?.darkMode);

    switch (page) {
        case 0: 
        return (<div>
            <Button 
                className="btn-label"
                onClick={() => setPage(1)}>
                Personal Information
                <ChevronRight/>
            </Button>
            <div className="switch-container">
                Dark Mode
                <Form.Switch
                    checked={userPrefs?.darkMode}
                    onChange={(event) => {
                                onSwitch(event.target.checked);
                            }}
                />
            </div>
        </div>);

        case 1:
        return (
        <>
            <div className="settingsProfile">
                <InfoTile>
                    <Button
                        className="btn-label"
                        onClick={() => setPage(0)}
                        >
                        <ChevronLeft/>
                    </Button>
                    <Row>
                        <Col>
                            First Name
                        </Col>
                        <Col>
                            <Button 
                                className="btn-edit"
                                onClick={() => {setModalOpen(true); setFieldState(0);}}
                            >
                                <>{studentData?.firstName}</>
                                <Pencil></Pencil>
                            </Button>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            Last Name
                        </Col>
                        <Col>
                            <Button 
                                className="btn-edit"
                                onClick={() => {setModalOpen(true); setFieldState(1);}}
                            >
                                {studentData?.lastName}
                                <Pencil></Pencil>
                            </Button>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            Username
                        </Col>
                        <Col>
                            <Button 
                                className="btn-edit"
                                onClick={() => {setModalOpen(true); setFieldState(2);}}
                                >
                                {studentData?.username}
                                <Pencil></Pencil>
                            </Button>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            University
                        </Col>
                        <Col>
                            <Button 
                                className="btn-edit"
                                onClick={() => {setModalOpen(true); setFieldState(3);}}
                                >
                                {studentData?.university}
                                <Pencil></Pencil>
                            </Button>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            Major
                        </Col>
                        <Col>
                            <Button 
                                className="btn-edit"
                                onClick={() => {setModalOpen(true); setFieldState(4);}}
                                >
                                {studentData?.major}
                                <Pencil></Pencil>
                            </Button>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            Canvas Token
                        </Col>
                        <Col>
                            <Button 
                                className="btn-edit"
                                onClick={() => {setModalOpen(true); setFieldState(5);}}
                                >
                                ***************
                                <Pencil></Pencil>
                            </Button>
                        </Col>
                    </Row>
                </InfoTile>
            </div>
            {isModalOpen && (
                <Modal onClose={() => setModalOpen(false)}>
                    <SettingsEditWindow state={fieldState} onClose={() => setModalOpen(false)}></SettingsEditWindow>
                </Modal>
            )}
        </>)
    }

    return (
        <div className="settingsMain">
            <Button 
                className="btn-label"
                onClick={setPage(1)}>
                Personal Information
                <ChevronRight/>
            </Button>
        </div>
    )
}
export default ProfileSettings;