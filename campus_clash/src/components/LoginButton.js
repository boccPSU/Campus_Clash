import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import { useNavigate } from "react-router-dom";

function LoginButton({uName, password }) {
    const [isLoading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        function registerNewUser() {
            let userData = {
                username: uName,
                password: password,
            };
            return fetch("/api/login", {
                method: "post",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userData),
            })
                .then((response) => response.json())
                .then((data) => {
                    console.log(data)
                    if (data.successful) {
                        console.log("Success!");
                        navigate("/");
                    } else {
                        console.log("Failure.");
                    }
                })
                .then(() => {
                    setLoading(false);
                });
        }

        if (isLoading) {
            registerNewUser().then(() => {
                setLoading(false);
            });
        }
    }, [isLoading]);

    const handleClick = () => setLoading(true);

    return (
        <Button
            variant="primary"
            disabled={isLoading}
            onClick={!isLoading ? handleClick : null}
        >
            {isLoading ? "Loading..." : "Login"}
        </Button>
    );
}

export default LoginButton;
