import { useEffect, useState } from "react";
import { Button, Form} from "react-bootstrap";
import {Link} from "react-router-dom"
import * as formik from "formik";
import * as yup from "yup";

function RegisterStudentPage({formData, setFormData, setStep, isLoading, setLoading}) {
    const [university, setUniversity] = useState(formData.university);
    const [major, setMajor] = useState(formData.major);
    const [canvasToken, setCanvasToken] = useState(formData.canvasToken);

    const {Formik} = formik;
    
    const schema = yup.object().shape({
        university: yup.string()
            .max(32, "Your first name cannot exceed 32 characters.")
            .matches(/^[A-Za-z'-]*$/, "Please enter the name of your University without special characters.")
            .required("Please enter the name of your University."),
        major: yup.string()
            .required("Please select your Major."),
        canvasToken: yup.string()
            .required("Please enter your Canvas Token."),
    });

    const handlePrevStep = () => {setStep(prevStep => prevStep - 1);}

    const handleSubmit = () => {
        setLoading(true);
    }

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
        <Formik
            validationSchema={schema}
            onSubmit={!isLoading ? handleSubmit : null}
            initialValues={formData}
        >
            {({ handleSubmit, handleChange, handleBlur, values, touched, errors}) => (
                <Form noValidate onSubmit={handleSubmit}>
                    <h3>Register</h3>
                    <Form.Label>University</Form.Label>
                    <Form.Group className="mb-3">
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
                            isInvalid={touched.university && !!errors.university}
                            maxLength={32}
                        />
                        <Form.Control.Feedback type="invalid">{errors.university}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Label>Major</Form.Label>
                    <Form.Group className="mb-3">
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
                            >
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
                        <Form.Control.Feedback type="invalid">{errors.major}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Label>Canvas Token</Form.Label>
                    <Form.Group className="mb-3">
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
                            isInvalid={touched.canvasToken && !!errors.canvasToken}
                            maxLength={100}
                        />
                        <Form.Control.Feedback type="invalid">{errors.canvasToken}</Form.Control.Feedback>
                        <a>How do I get my </a><Link target={"_blank"} to="https://community.canvaslms.com/t5/Canvas-Basics-Guide/How-do-I-manage-API-access-tokens-in-my-user-account/ta-p/615312#open-user-settings">Canvas Token?</Link>
                    </Form.Group>
                    <Button
                        className="me-2"
                        onClick={handlePrevStep}
                    >
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
