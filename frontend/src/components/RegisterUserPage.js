import { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import * as formik from "formik";
import * as yup from "yup";


function RegisterUserPage({formData, setFormData, setStep, isLoading, setLoading}) {
    const [fName, setFName] = useState(formData.firstName);
    const [lName, setLName] = useState(formData.lastName);
    const [uName, setUName] = useState(formData.username);
    const [password, setPassword] = useState(formData.password);

    const {Formik} = formik;

    const schema = yup.object().shape({
        firstName: yup.string()
            .max(32, "Your first name cannot exceed 32 characters.")
            .matches(/^[A-Za-z'-]*$/, "Please enter your name without special characters.")
            .required("Please enter your first name."),
        lastName: yup.string()
            .max(32, "Your last name cannot exceed 32 characters.")
            .matches(/^[A-Za-z'-]*$/, "Please enter your name without special characters.")
            .required("Please enter your last name."),
        username: yup.string()
            .min(6, "Your username must be 6-32 characters long.")
            .max(32, "Your username must be 6-32 characters long.")
            .matches(/^[A-Za-z0-9'-_]*$/, "Please enter a username without special characters.")
            .required("Please enter your username."),
        password: yup.string()
            .min(8, "Your password must be 8-20 characters long.")
            .max(20, "Your password must be 8-20 characters long.")
            .required("Please enter a password.")
            .matches(/[a-z]/, "Password must contain at lease one lowercase letter.")
            .matches(/[A-Z]/, "Password must contain at least one uppercase letter.")
            .matches(/[0-9]/, "Password must contain at least one number.")
            .matches(/[^a-zA-Z0-9]/, "Password must contain at least one special character.")
    });

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
            validationSchema={schema}
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
