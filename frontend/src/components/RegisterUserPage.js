import { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import * as formik from "formik";
import validationSchema from "../api/validationSchema";


function RegisterUserPage({formData, setFormData, setStep, isLoading, setLoading}) {
    const [fName, setFName] = useState(formData.firstName);
    const [lName, setLName] = useState(formData.lastName);
    const [uName, setUName] = useState(formData.username);
    const [password, setPassword] = useState(formData.password);

    const {Formik} = formik;

    const handleNextStep = () => {
        setStep(prevStep => prevStep + 1);
    }

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
        <Formik
            validationSchema={validationSchema()}
            onSubmit={handleNextStep}
            initialValues={formData}
        >
            {({ handleSubmit, handleChange, handleBlur, values, touched, errors}) => (
                <Form noValidate onSubmit={handleSubmit}>
                    <h3>Register</h3>
                    <Form.Label>First Name</Form.Label>
                    <Form.Group className="mb-1">
                            <Form.Control
                                type="text"
                                name="firstName"
                                value={values.firstName}
                                placeholder="First Name"
                                aria-label="First Name"
                                aria-describedby="basic-addon1"
                                onChange={(event) => {
                                    handleChange(event);
                                    setFName(event.target.value);
                                }}
                                onBlur={handleBlur}
                                isInvalid={touched.firstName && !!errors.firstName}
                                maxLength={32}
                            />
                            <Form.Control.Feedback type="invalid">{errors.firstName}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Label>Last Name</Form.Label>
                    <Form.Group className="mb-1">
                            <Form.Control
                                type="text"
                                name="lastName"
                                value={values.lastName}
                                placeholder="Last Name"
                                aria-label="Last Name"
                                aria-describedby="basic-addon1"
                                onChange={(event) => {
                                    handleChange(event);
                                    setLName(event.target.value);
                                }}
                                onBlur={handleBlur}
                                isInvalid={touched.lastName && !!errors.lastName}
                                maxLength={32}
                            />
                            <Form.Control.Feedback type="invalid">{errors.lastName}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Label>Username</Form.Label>
                    <Form.Group className="mb-1">
                        <Form.Control
                            type="text" 
                            name="username"
                            value={values.username}
                            placeholder="Username"
                            aria-label="Username"
                            aria-describedby="basic-addon1"
                            onChange={(event) => {
                                handleChange(event);
                                setUName(event.target.value);
                            }}
                            onBlur={handleBlur}
                            isInvalid={touched.username && !!errors.username}
                            maxLength={32}
                        />
                        <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Label>Password</Form.Label>
                    <Form.Group className="mb-1">
                        <Form.Control
                            type="password" 
                            name="password"
                            value={values.password}
                            placeholder="Password"
                            aria-label="Password"
                            aria-describedby="basic-addon1"
                            onChange={(event) => {
                                handleChange(event);
                                setPassword(event.target.value);
                            }}
                            onBlur={handleBlur}
                            isInvalid={touched.password && !!errors.password}
                            maxLength={20}
                        />
                        <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                    </Form.Group>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={isLoading}
                    >
                        {isLoading ? "Loading..." : "Next"}
                    </Button>
                </Form>
            )}
        </Formik>
    );
}

export default RegisterUserPage;
