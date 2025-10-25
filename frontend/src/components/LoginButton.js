import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";

function LoginButton({login}) {
    const [isLoading, setLoading] = useState(false);

    useEffect(() => {
        if (isLoading) {
            login().then(() => {
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
