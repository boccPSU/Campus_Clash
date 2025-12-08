import { useEffect, useState } from "react";
import RegisterUserPage from "../../components/RegisterUserPage.js";
import RegisterStudentPage from "../../components/RegisterStudentPage";
import { useNavigate, Link } from "react-router-dom";
import { Spinner } from "react-bootstrap";              

import { useAuth } from "../../api/AuthContext.js";

function RegisterScreen() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        username: "",
        password: "",
        university: "",
        major: "",
        canvasToken: ""
    });

    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const { setToken, token, isStudentDataFilled, studentDataLoading } = useAuth();

    useEffect(() => {
        if (isLoading) {
            registerNewUser().then(() => {
                setLoading(false);
            });
        }
    }, [isLoading]);

    // Navigate to home if registration is complete
    useEffect(() => {
        if (!token) return;

        if (!studentDataLoading && isStudentDataFilled()) {
            navigate("/home");
        }
    }, [token, studentDataLoading, isStudentDataFilled, navigate]);

    const registerNewUser = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/register", {
                method: "post",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });
            if (res.status === 500)
                throw new Error("[REGISTER] Error", { cause: "Unable to Connect." });

            const data = await res.json();
            if (!res.ok)
                throw new Error("[Register] Error", { cause: data.error });

            if (data.successful) {
                setToken({ token: data.token });
                // Now AuthContext will start loading student data
            } else {
                setError(data.error);
            }
        } catch (e) {
            console.log(e);
            setError(e.cause);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <RegisterUserPage
                        formData={formData}
                        setFormData={setFormData}
                        setStep={setStep}
                        isLoading={isLoading}
                        setLoading={setLoading}
                    />
                );
            case 2:
                return (
                    <RegisterStudentPage
                        formData={formData}
                        setFormData={setFormData}
                        setStep={setStep}
                        isLoading={isLoading}
                        setLoading={setLoading}
                    />
                );
            default:
                return (
                    <RegisterUserPage
                        formData={formData}
                        setFormData={setFormData}
                    />
                );
        }
    };

    //If we have a token and the student data is loading, show ONLY a spinner
    if (token && studentDataLoading) {
        return (
            <div className="entry-bg">
            <div className="entry-container">
                <h1 className="loadingLabel">Loading</h1>
                <Spinner className="loadingSpinner" animation="border" role="status">
                    
                </Spinner>
            </div>
        </div>
        );
    }

    return (
        <div className="entry-bg">
            <div className="entry-container">
                {error && <div className="text-danger">{error}</div>}
                {renderStep()}
                <div>
                    <span>Already have an account? </span>
                    <Link to="/login">Log In.</Link>
                </div>
            </div>
        </div>
    );
}

export default RegisterScreen;
