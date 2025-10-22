import { useState} from "react";
import RegisterButton from "../components/RegisterButton.js";
import { Form, InputGroup } from "react-bootstrap";

function RegisterScreen() {
    const [fName, setFName] = useState("");
    const [lName, setLName] = useState("");
    const [uName, setUName] = useState("");
    const [password, setpassword] = useState("");

    return (
        <>
            <div className="register template d-flex justify-content-center align-items-center 100-w vh-100 bg-primary">
                <div className='40-w p-5 rounded bg-light'>
                    <form>
                        <h3>Register</h3>
                        <Form.Label>Name</Form.Label>
                        <InputGroup className="mb-3">
                            <Form.Control
                                value={fName}
                                placeholder="First Name"
                                aria-label="First Name"
                                aria-describedby="basic-addon1"
                                onChange={(event) => {
                                    setFName(event.target.value);
                                }}
                            />
                            <Form.Control
                                value={lName}
                                placeholder="Last Name"
                                aria-label="Last Name"
                                aria-describedby="basic-addon1"
                                onChange={(event) => {
                                    setLName(event.target.value);
                                }}
                            />
                        </InputGroup>

                        <Form.Label>Username</Form.Label>
                        <InputGroup className="mb-3">
                            <Form.Control
                                value={uName}
                                placeholder="Username"
                                aria-label="Username"
                                aria-describedby="basic-addon1"
                                onChange={(event) => {
                                    setUName(event.target.value);
                                }}
                            />
                        </InputGroup>

                        <Form.Label>Password</Form.Label>
                        <InputGroup className="mb-3">
                            <Form.Control
                                value={password}
                                placeholder="Password"
                                aria-label="Password"
                                aria-describedby="basic-addon1"
                                onChange={(event) => {
                                    setpassword(event.target.value);
                                }}
                            />
                        </InputGroup>
                        <RegisterButton
                            fName={fName}
                            lName={lName}
                            uName={uName}
                            password={password}
                        ></RegisterButton>
                    </form>
                </div>
            </div>
        </>
    );
}

export default RegisterScreen;
