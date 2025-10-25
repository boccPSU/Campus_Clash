import { useState} from "react";
import RegisterButton from "../components/RegisterButton.js";
import { Form, InputGroup } from "react-bootstrap";
import { useNavigate, Link} from "react-router-dom";

function RegisterScreen({setToken}) {
    const [fName, setFName] = useState("");
    const [lName, setLName] = useState("");
    const [uName, setUName] = useState("");
    const [password, setpassword] = useState("");

    const navigate = useNavigate();

    const registerNewUser = () => {
        let userData = {
            firstName: fName,
            lastName: lName,
            username: uName,
            password: password,
        };
        return fetch("/api/register", {
            method: "post",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
        })
        .then((response) => response.json())
        .then((data) => {
            console.log(data)
            if (data.successful) {
                console.log("Success!");
                setToken({"token": data.token});
                navigate("/");
            } else {
                console.log("Failure.");
            }
        })
    }

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
                            registerNewUser = {registerNewUser}
                        ></RegisterButton>
                    </form>
                    <div>
                        <a>Already have an account? </a><Link to="/login">Log In.</Link>
                    </div>
                </div>
            </div>
        </>
    );
}

export default RegisterScreen;
