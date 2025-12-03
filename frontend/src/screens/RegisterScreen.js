import { useEffect, useState } from "react";
import RegisterUserPage from "../components/RegisterUserPage.js";
import RegisterStudentPage from "../components/RegisterStudentPage";
import { useNavigate, Link} from "react-router-dom";

import {useAuth} from "../api/AuthContext.js";

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

    const {setToken} = useAuth();

    useEffect(() => {
        if (isLoading) {
            registerNewUser().then(() => {
                setLoading(false);
            });
        }
    }, [isLoading]);

    const registerNewUser = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/register", {
                method: "post",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });
            if (res.status === 500) throw new Error("[REGISTER] Error", {cause: "Unable to Connect."});
            const data = await res.json();
            if (!res.ok) throw new Error("[Register] Error", {cause: data.error});
            if (data.successful) {
                setToken({"token": data.token});
                navigate("/home");
            } else {
                setError(data.error);
            }
        } catch (e) {
            console.log(e);
            setError(e.cause);
        }
    }

    const renderStep = () => {
        switch (step) {
            case 1:
                return <RegisterUserPage formData={formData} setFormData={setFormData} setStep={setStep} isLoading={isLoading} setLoading={setLoading}></RegisterUserPage>
            case 2:
                return <RegisterStudentPage formData={formData} setFormData={setFormData} setStep={setStep} isLoading={isLoading} setLoading={setLoading}></RegisterStudentPage>
            default:
                return <RegisterUserPage formData={formData} setFormData={setFormData}></RegisterUserPage>
        }
    }

    return (
        <>
            <div className="register template d-flex justify-content-center align-items-center 100-w vh-100 bg-primary">
                <div className='p-5 width:50 rounded bg-light'>
                    {error && (
                        <div className="text-danger">{error}</div>
                    )}
                    {renderStep()}
                    <div>
                        <a>Already have an account? </a><Link to="/login">Log In.</Link>
                    </div>
                </div>
            </div>
        </>
    );
}

export default RegisterScreen;
