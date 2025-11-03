import { useEffect, useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import { useNavigate, Link} from "react-router-dom";

function RegisterUserPage({formData, setFormData}) {
    const [fName, setFName] = useState(formData.firstName);
    const [lName, setLName] = useState(formData.lastName);
    const [uName, setUName] = useState(formData.username);
    const [password, setPassword] = useState(formData.password);

    useEffect(() => {
        setFormData({
            firstName: fName,
            lastName: lName,
            username: uName,
            password: password,
            university: formData.university,
            major: formData.major,
            canvasToken: formData.canvasToken
        });
    }, [fName, lName, uName, password]);

    return (
        <>
            <h3>Register</h3>
            <Form.Label>Name</Form.Label>
            <InputGroup className="mb-3" hasValidation>
                <div className="flex-fill me-2">
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
                </div>
                <div className = "flex-fill">
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
                </div>
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
            <InputGroup className="mb-3" hasValidation>
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
