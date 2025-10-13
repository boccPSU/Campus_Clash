import {useEffect, useState} from 'react';
import Button from 'react-bootstrap/Button';

function RegisterButton() {
    const [isLoading, setLoading] = useState(false);

    useEffect(() => {
        function registerNewUser(fName, lName, uName, password) {
            let userData = {
                firstName:fName,
                lastName:lName,
                username:uName,
                password:password
            }
            return fetch('/api/register', {
                method:'post',
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify(userData)
            }).then(response => response.json()).then(data=>{
                console.log(data);
            }).then(() => {
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
            disbaled={isLoading}
            onClick={!isLoading ? handleClick : null}
        >
            {isLoading ? "Loading..." : "Register"}
        </Button>
    );
}

export default RegisterButton;