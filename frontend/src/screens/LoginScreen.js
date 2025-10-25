import { useState} from "react";
import LoginButton from "../components/LoginButton.js";
import { Form, InputGroup } from "react-bootstrap";
import { useNavigate, Link} from "react-router-dom";

function LoginScreen({setToken}) {
    const [uName, setUName] = useState("");
    const [password, setpassword] = useState("");
    
    const navigate = useNavigate();

    const login = () => {
        let userData = {
            username: uName,
            password: password,
        };
        return fetch("/api/login", {
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
                            login = {login}
                        ></LoginButton>
                    </form>
                    <div>
                        <Link to="" >Forgot Password?</Link><br />
                        <a>Don't have an account? </a><Link to="/register">Sign Up.</Link>
                    </div>
                </div>
            </div>
        </>
    );
}

export default LoginScreen;
