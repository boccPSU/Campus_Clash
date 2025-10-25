import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";

function RegisterButton({registerNewUser}) {
    const [isLoading, setLoading] = useState(false);

    useEffect(() => {
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
            {isLoading ? "Loading..." : "Register"}
        </Button>
    );
}

export default RegisterButton;
