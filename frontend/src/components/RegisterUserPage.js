import { useEffect, useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import { useNavigate, Link} from "react-router-dom";

function RegisterUserPage(formData, {setFormData}) {
    const [fName, setFName] = useState("");
    const [lName, setLName] = useState("");
    const [uName, setUName] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        setFormData({
            firstName: fName,
            lastName: lName,
            username: uName,
            password: password,
            university: "",
            major: ""
        })
    }, [fName, lName, uName, password]);

    return (
        <>
            <h3>Register</h3>
            <Form.Label>Name</Form.Label>
            <InputGroup className="mb-3" hasValidation>
                <Form.Control
                    type="text" 
                    required
                    value={fName}
                    placeholder="First Name"
                    aria-label="First Name"
                    aria-describedby="basic-addon1"
                    onChange={(event) => {
                        setFName(event.target.value);
                    }}
                />
                <Form.Control.Feedback type="invalid">Please Enter your First Name.</Form.Control.Feedback>
                <Form.Control
                    type="text" 
                    required 
                    value={lName}
                    placeholder="Last Name"
                    aria-label="Last Name"
                    aria-describedby="basic-addon1"
                    onChange={(event) => {
                        setLName(event.target.value);
                    }}
                />
                <Form.Control.Feedback type="invalid">Please Enter your Last Name.</Form.Control.Feedback>
            </InputGroup>

            <Form.Label>Username</Form.Label>
            <InputGroup className="mb-3" hasValidation>
                <Form.Control
                    type="text" 
                    required
                    value={uName}
                    placeholder="Username"
                    aria-label="Username"
                    aria-describedby="basic-addon1"
                    onChange={(event) => {
                        setUName(event.target.value);
                    }}
                />
                <Form.Control.Feedback type="invalid">Please Enter a Username.</Form.Control.Feedback>
            </InputGroup>

            <Form.Label>Password</Form.Label>
            <InputGroup className="mb-3">
                <Form.Control
                    type="text" 
                    required
                    value={password}
                    placeholder="Password"
                    aria-label="Password"
                    aria-describedby="basic-addon1"
                    onChange={(event) => {
                        setPassword(event.target.value);
                    }}
                />
                <Form.Control.Feedback type="invalid">Please Enter a Password.</Form.Control.Feedback>
            </InputGroup>
        </>
    );
}

export default RegisterUserPage;
