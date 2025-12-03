import { useEffect, useState } from "react";
import { Form, Button } from "react-bootstrap";
import { useNavigate, Link} from "react-router-dom";
import * as formik from "formik";
import * as yup from "yup";

import {useAuth} from "../api/AuthContext";

function LoginScreen() {
    const navigate = useNavigate();

    const {setToken} = useAuth();

    const [formData, setFormData] = useState({
        username: "",
        password: ""
    });
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isLoading) {
            login().then(() => {
                setLoading(false);
            });
        }
    }, [isLoading]);

    const handleSubmit = () => {
        setLoading(true);
    }

    const login = async () => {
        try {
            setError("");
            const res = await fetch("/api/login", {
                method:"POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(formData)
            });
            if (res.status === 500) throw new Error("[LOGIN] Error", {cause: "Unable to Connect."});
            const data = await res.json();
            console.log(data);
            if (!res.ok) throw new Error("[LOGIN] Error", {cause: data.error});

            if (data.successful) {
                setToken({"token": data.token});
                navigate("/home");
            } else {
                setError(data.error);
            }
        } catch(e) {
            console.log(e);
            setError(e.cause);
        }
    };

    const {Formik} = formik;

    const schema = yup.object().shape({
        username: yup.string()
            .matches(/^[A-Za-z0-9'-_]*$/, "Please enter your username without special characters.")
            .required("Please enter your username."),
        password: yup.string()
            .required("Please enter a password.")
        });

    return (
        <Formik
            validationSchema={schema}
            onSubmit={handleSubmit}
            initialValues={{
                username: "",
                password: ""
            }}
        >
            {({ handleSubmit, handleChange, handleBlur, values, touched, errors}) => (
                <div className="register template d-flex justify-content-center align-items-center 100-w vh-100 bg-primary">
                    <div className='40-w p-5 rounded bg-light'>
                        <Form noValidate onSubmit={handleSubmit}>
                            <h3>Login</h3>
                            {error && (
                                <div className="text-danger">{error}</div>
                            )}
                            <Form.Label>Username</Form.Label>
                            <Form.Group className="mb-3">
                                <Form.Control
                                    type="text"
                                    name="username"
                                    value={values.username}
                                    required
                                    placeholder="Username"
                                    aria-label="Username"
                                    aria-describedby="basic-addon1"
                                    onChange={(event) => {
                                        handleChange(event);
                                        setFormData({
                                            username: event.target.value,
                                            password: formData.password
                                        })
                                    }}
                                    onBlur={handleBlur}
                                    isInvalid={touched.username && !!errors.username}
                                    maxLength={32}
                                />
                                <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
                            </Form.Group>

                            <Form.Label>Password</Form.Label>
                            <Form.Group className="mb-3">
                                <Form.Control
                                    type="password"
                                    name="password"
                                    value={values.password}
                                    required
                                    placeholder="Password"
                                    aria-label="Password"
                                    aria-describedby="basic-addon1"
                                    onChange={(event) => {
                                        handleChange(event);
                                        setFormData({
                                            username: formData.username,
                                            password: event.target.value
                                        })
                                    }}
                                    isInvalid={touched.password && !!errors.password}
                                    onBlur={handleBlur}
                                    maxLength={20}
                                />
                                <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                            </Form.Group>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={isLoading}
                            >
                                {isLoading ? "Loading..." : "Log In"}
                            </Button>
                        </Form>
                        <div>
                            <Link to="" >Forgot Password?</Link><br />
                            <a>Don't have an account? </a><Link to="/register">Sign Up.</Link>
                        </div>
                    </div>
                </div>
            )}
        </Formik>
    );
}

export default LoginScreen;
