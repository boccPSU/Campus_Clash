import {useState} from "react";
import {Row, Col, Navbar, Container, Button} from "react-bootstrap";
import {Pencil, ArrowLeft} from "react-bootstrap-icons";

import "./Settings.scss";
import SettingsEditWindow from "./SettingsEditWindow";

const Modal = ({children, onClose }) => {
    return (
        <>
            <div className="backdrop" onClick={onClose}></div>

            <div className="modalMain">
                <Button onClick={onClose}>Close</Button>
                {children}
            </div>
        </>
    );
};

function SettingsProfile({setPage}) {

    const [isModalOpen, setModalOpen] = useState(false);
    const [fieldState, setFieldState] = useState(0);

    const studentData = JSON.parse(sessionStorage.getItem("studentData"));

    const handleBack = () => {
        setPage(0);
    }

    return (
        <>
            <Navbar
                className={`headerBar`}
                role="banner"
                aria-label="Profile Settings Header"
                >
                <Container>
                    <ArrowLeft
                    size={28}
                    className="headerIcon"
                    tabIndex={0}
                    aria-label="Back"
                    role="button"
                    onClick={handleBack}
                    />
                    <div className="text-center text-white flex-grow-1">
                        <div className="headerTitle">{"Profile"}</div>
                    </div>
                </Container>
            </Navbar>
            <div className="settingsProfile">
                <Row>
                    <Col>
                        First Name
                    </Col>
                    <Col>
                        <Button 
                            className="editButton"
                            onClick={() => {setModalOpen(true); setFieldState(0);}}
                        >
                            {studentData?.firstName}
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
                            className="editButton"
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
                            className="editButton"
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
                            className="editButton"
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
                            className="editButton"
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
                            className="editButton"
                            onClick={() => {setModalOpen(true); setFieldState(5);}}
                            >
                            ***************
                            <Pencil></Pencil>
                        </Button>
                    </Col>
                </Row>
            </div>
            {isModalOpen && (
                <Modal onClose={() => setModalOpen(false)}>
                    <SettingsEditWindow state={fieldState} onClose={() => setModalOpen(false)}></SettingsEditWindow>
                </Modal>
            )}
        </>
    );
};
export default SettingsProfile;