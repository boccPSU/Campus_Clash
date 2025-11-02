import { useEffect, useState } from "react";
import RegisterUserPage from "../components/RegisterUserPage.js";
import { Button, Form, InputGroup } from "react-bootstrap";
import { useNavigate, Link} from "react-router-dom";

function RegisterScreen({setToken}) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        username: "",
        password: "",
        university: "",
        major: "",
    });

    const [validated, setValidated] = useState(false);
    const [isLoading, setLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (isLoading) {
            registerNewUser().then(() => {
                setLoading(false);
            });
        }
    }, [isLoading]);

    const handleSubmit = (event) => {
        const form = event.currentTarget;
        event.preventDefault();
        console.log("Check Validity: ", form.checkValidity());
        if (form.checkValidity() === false) {
            event.stopPropagation();
            console.log("Invalid Form...");
        } else {
            setLoading(true);
        }
        setValidated(true);
    }

    const registerNewUser = () => {
        return fetch("/api/register", {
            method: "post",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        })
        .then((response) => response.json())
        .then((data) => {
            console.log(data)
            if (data.successful) {
                console.log("Success!");
                setToken({"token": data.token});
                navigate("/");
            } else {
                console.log("Failure.");
            }
        })
    }

    const renderStep = () => {
        switch (step) {
            case 1:
                return <RegisterUserPage formData={formData} setFormData={setFormData}></RegisterUserPage>

            default:
                return <RegisterUserPage formData={formData} setFormData={setFormData}></RegisterUserPage>
        }
    }

    return (
        <>
            <div className="register template d-flex justify-content-center align-items-center 100-w vh-100 bg-primary">
                <div className='40-w p-5 rounded bg-light'>
                    <Form noValidate validated={validated} onSubmit={!isLoading ? handleSubmit : null}>
                        {renderStep()}
                    </Form>
                    <div>
                        <a>Already have an account? </a><Link to="/login">Log In.</Link>
                    </div>
                </div>
            </div>
        </>
    );
}

export default RegisterScreen;
