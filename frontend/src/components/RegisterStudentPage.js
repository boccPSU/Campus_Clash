import { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import * as formik from "formik";
import { studentValidationSchema } from "../api/validationSchema";

function RegisterStudentPage({
    formData,
    setFormData,
    setStep,
    isLoading,
    setLoading,
}) {
    const [university, setUniversity] = useState(formData.university);
    const [major, setMajor] = useState(formData.major);
    const [canvasToken, setCanvasToken] = useState(formData.canvasToken);

    const { Formik } = formik;

    const handlePrevStep = () => {
        setStep((prevStep) => prevStep - 1);
    };

    const handleSubmit = () => {
        setLoading(true);
    };

    useEffect(() => {
        setFormData({
            firstName: formData.firstName,
            lastName: formData.lastName,
            username: formData.username,
            password: formData.password,
            university: university,
            major: major,
            canvasToken: canvasToken,
        });
    }, [university, major, canvasToken]);

    return (
        <Formik
            validationSchema={studentValidationSchema()}
            onSubmit={!isLoading ? handleSubmit : null}
            initialValues={formData}
        >
            {({
                handleSubmit,
                handleChange,
                handleBlur,
                values,
                touched,
                errors,
            }) => (
                <Form noValidate onSubmit={handleSubmit}>
                    <h3>Register</h3>
                    <Form.Label>University</Form.Label>
                    <Form.Group className="input-field">
                        <Form.Control
                            type="text"
                            name="university"
                            value={values.university}
                            placeholder="University"
                            aria-label="University"
                            aria-describedby="basic-addon1"
                            onChange={(event) => {
                                handleChange(event);
                                setUniversity(event.target.value);
                            }}
                            onBlur={handleBlur}
                            isInvalid={
                                touched.university && !!errors.university
                            }
                            maxLength={32}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.university}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Label>Major</Form.Label>
                    
                    <Form.Group className="input-field">
                        <Form.Select
                            aria-label="Major Select"
                            name="major"
                            defaultValue={values.major}
                            onChange={(event) => {
                                handleChange(event);
                                setMajor(event.target.value);
                            }}
                            onBlur={handleBlur}
                            isInvalid={touched.major && !!errors.major}
                            size={6}
                        >
                            <option value="">Select your Major.</option>
                            <option value="Computer Science">
                                Computer Science
                            </option>
                            <option value="Software Engineering">
                                Software Engineering
                            </option>
                            <option value="Mathematics">Mathematics</option>
                            <option value="Statistics">Statistics</option>
                            <option value="Physics">Physics</option>
                            <option value="Chemistry">Chemistry</option>
                            <option value="Biology">Biology</option>
                            <option value="Psychology">Psychology</option>
                            <option value="Economics">Economics</option>
                            <option value="Business Admin">
                                Business Admin
                            </option>
                            <option value="Marketing">Marketing</option>
                            <option value="Finance">Finance</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                            {errors.major}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Label>Canvas Token</Form.Label>
                    <Form.Group className="input-field">
                        <Form.Control
                            type="text"
                            name="canvasToken"
                            value={values.canvasToken}
                            placeholder="Canvas Token"
                            aria-label="Canvas"
                            aria-describedby="basic-addon1"
                            onChange={(event) => {
                                handleChange(event);
                                setCanvasToken(event.target.value);
                            }}
                            onBlur={handleBlur}
                            isInvalid={
                                touched.canvasToken && !!errors.canvasToken
                            }
                            maxLength={100}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.canvasToken}
                        </Form.Control.Feedback>
                        <a>How do I get my </a>
                        <Link
                            target={"_blank"}
                            to="https://community.canvaslms.com/t5/Canvas-Basics-Guide/How-do-I-manage-API-access-tokens-in-my-user-account/ta-p/615312#open-user-settings"
                        >
                            Canvas Token?
                        </Link>
                    </Form.Group>
                    <Button className="me-2" onClick={handlePrevStep}>
                        Previous
                    </Button>
                    <Button
                        type="Submit"
                        variant="primary"
                        disabled={isLoading}
                    >
                        {isLoading ? "Loading..." : "Register"}
                    </Button>
                </Form>
            )}
        </Formik>
    );
}

export default RegisterStudentPage;
