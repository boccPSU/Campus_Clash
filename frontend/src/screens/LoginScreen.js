import { useEffect, useState } from "react";
import { Form, InputGroup, Button } from "react-bootstrap";
import { useNavigate, Link} from "react-router-dom";

function LoginScreen({setToken}) {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: "",
        password: ""
    });

    const [validated, setValidated] = useState(false);
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isLoading) {
            login().then(() => {
                setLoading(false);
            });
        }
    }, [isLoading]);

    const handleSubmit = (event) => {
        const form = event.currentTarget;
        event.preventDefault();
        if (form.checkValidity() === false) {
            event.stopPropagation();
        } else {
            setLoading(true);
        }
        setValidated(true);
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

    return (
        <>
            <div className="register template d-flex justify-content-center align-items-center 100-w vh-100 bg-primary">
                <div className='40-w p-5 rounded bg-light'>
                    <Form noValidate validated={validated} onSubmit={!isLoading ? handleSubmit : null}>
                        <h3>Login</h3>
                        {error && (
                            <div className="text-danger">{error}</div>
                        )}
                        <Form.Label>Username</Form.Label>
                        <InputGroup className="mb-3" hasValidation>
                            <Form.Control
                                value={formData.username}
                                required
                                placeholder="Username"
                                aria-label="Username"
                                aria-describedby="basic-addon1"
                                onChange={(event) => {
                                    setFormData({
                                        username: event.target.value,
                                        password: formData.password
                                    })
                                }}
                            />
                            <Form.Control.Feedback type="invalid">Please enter your Username.</Form.Control.Feedback>
                        </InputGroup>

                        <Form.Label>Password</Form.Label>
                        <InputGroup className="mb-3" hasValidation>
                            <Form.Control
                                value={formData.password}
                                required
                                placeholder="Password"
                                aria-label="Password"
                                aria-describedby="basic-addon1"
                                onChange={(event) => {
                                    setFormData({
                                        username: formData.username,
                                        password: event.target.value
                                    })
                                }}
                            />
                            <Form.Control.Feedback type="invalid">Please enter your Password.</Form.Control.Feedback>
                        </InputGroup>
                        <Button
                            type="Submit"
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
        </>
    );
}

export default LoginScreen;
