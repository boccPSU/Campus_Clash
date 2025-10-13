import React from "react";
import RegisterButton from "../components/RegisterButton.js";
import {Form, InputGroup} from 'react-bootstrap';

function RegisterScreen() {
    return (
        <>
            <h3>Register</h3>
            <Form.Label>Name</Form.Label>
            <InputGroup className="mb-3">
                <InputGroup.Text>Name</InputGroup.Text>
                <Form.Control
                    placeholder="First Name"
                    aria-label="First Name"
                    aria-describedby="basic-addon1"
                />
                <Form.Control
                    placeholder="Last Name"
                    aria-label="Last Name"
                    aria-describedby="basic-addon1"
                />
            </InputGroup>


            <Form.Label>Username</Form.Label>
            <InputGroup className="mb-3">
                <Form.Control
                    placeholder="Username"
                    aria-label="Username"
                    aria-describedby="basic-addon1"
                />
            </InputGroup>

            <Form.Label>Password</Form.Label>
            <InputGroup className="mb-3">
                <Form.Control
                    placeholder="Password"
                    aria-label="Password"
                    aria-describedby="basic-addon1"
                />
            </InputGroup>
            <RegisterButton>

            </RegisterButton>
        </>
    );
}

export default RegisterScreen;