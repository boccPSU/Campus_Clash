import { useState} from "react";
import LoginButton from "../components/LoginButton.js";
import { Form, InputGroup } from "react-bootstrap";

function LoginScreen() {
    const [uName, setUName] = useState("");
    const [password, setpassword] = useState("");

    return (
        <>
            <div className="register template d-flex justify-content-center align-items-center 100-w vh-100 bg-primary">
                <div className='40-w p-5 rounded bg-light'>
                    <form>
                        <h3>Login</h3>
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
                        <LoginButton
                            uName={uName}
                            password={password}
                        ></LoginButton>
                    </form>
                </div>
            </div>
        </>
    );
}

export default LoginScreen;
