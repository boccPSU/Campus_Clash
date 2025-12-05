import {useState} from "react";
import {Button, Row, Col} from "react-bootstrap";
import {ChevronLeft, ChevronRight, Pencil, X} from "react-bootstrap-icons";

import SettingsEditWindow from "../../components/SettingsComponents/SettingsEditWindow";

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
    const {studentData} = useAuth();

    const [page, setPage] = useState(0)
    const [isModalOpen, setModalOpen] = useState(false);
    const [fieldState, setFieldState] = useState(0);

    switch (page) {
        case 0: 
        return (<div>
            <Button 
                className="btn-label"
                onClick={() => setPage(1)}>
                Personal Information
                <ChevronRight/>
            </Button>
            {/* <Button 
                className="navButton"
                onClick={toNotificationSettings}
            >
                <Gear></Gear>
                Notifications
                <ArrowRight></ArrowRight>    
            </Button> */}
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