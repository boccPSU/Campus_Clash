import { useEffect, useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import { useNavigate, Link} from "react-router-dom";

function RegisterStudentPage({formData, setFormData}) {
    const [university, setUniversity] = useState(formData.university);
    const [major, setMajor] = useState(formData.major);
    const [canvasToken, setCanvasToken] = useState(formData.canvasToken);

    useEffect(() => {
        setFormData({
            firstName: formData.firstName,
            lastName: formData.lastName,
            username: formData.username,
            password: formData.password,
            university: university,
            major: major,
            canvasToken: canvasToken
        });
    }, [university, major, canvasToken]);

    return (
        <>
            <h3>Register</h3>
            <Form.Label>University</Form.Label>
            <InputGroup className="mb-3" hasValidation>
                <Form.Control
                    type="text" 
                    required
                    value={university}
                    placeholder="University"
                    aria-label="University"
                    aria-describedby="basic-addon1"
                    onChange={(event) => {
                        setUniversity(event.target.value);
                    }}
                />
                <Form.Control.Feedback type="invalid">Please enter the name of your University.</Form.Control.Feedback>
            </InputGroup>

            <Form.Label>Major</Form.Label>
            <InputGroup className="mb-3" hasValidation>
                <Form.Select 
                    aria-label="Major Select"
                    required
                    defaultValue={formData.major}
                    onChange={(event) => {
                        setMajor(event.target.value);
                    }}>
                    <option value = "">Select your Major.</option>
                    <option value = "Business">Business</option>
                    <option value = "Nursing">Nursing</option>
                    <option value = "Psychology">Psychology</option>
                    <option value = "Education">Education</option>
                    <option value = "Biology">Biology</option>
                    <option value = "Criminal Justice">Criminal Justice</option>
                    <option value = "Computer Science">Computer Science</option>
                    <option value = "Accounting">Accounting</option>
                    <option value = "Engineering">Engineering</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">Please select your major.</Form.Control.Feedback>
            </InputGroup>

            <Form.Label>Canvas Token</Form.Label>
            <InputGroup className="mb-3">
                <Form.Control
                    type="text" 
                    required
                    value={canvasToken}
                    placeholder="Canvas Token"
                    aria-label="Canvas"
                    aria-describedby="basic-addon1"
                    onChange={(event) => {
                        setCanvasToken(event.target.value);
                    }}
                />
                <Form.Control.Feedback type="invalid">Please enter a Canvas Token.</Form.Control.Feedback>
            </InputGroup>
        </>
    );
}

export default RegisterStudentPage;
