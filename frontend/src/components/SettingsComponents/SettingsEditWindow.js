import {useState, useEffect} from "react";
import {Form, Button} from "react-bootstrap";
import * as formik from "formik";

import {useAuth} from "../../api/AuthContext";
import {singleFieldSchema} from "../../api/validationSchema";

function SettingsEditWindow({state, onClose}) {

    const {Formik} = formik;

    const {token, setToken, loadStudentData} = useAuth();

    const studentData = JSON.parse(sessionStorage.getItem("studentData"));

    const [field, setField] = useState("");
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const save = async () => {
        console.log("[Change-User-Info] Starting API Call.");
        const newData = {
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            username: studentData.username,
            university: studentData.university,
            major: studentData.major,
            canvasToken: studentData.canvasToken
        }
        newData[schemaName] = field;

        try {
            const res = await fetch("/api/change-user-info", {
                method: "post",
                headers: {
                    "Content-Type": "application/json",
                    "jwt-token": token
                },
                body: JSON.stringify(newData),
            });
            if (res.status === 500) throw new Error("[Change-User-Info] Error", {cause: "Unable to Connect."});
            const data = await res.json();
            if (!res.ok) throw new Error("[Change-User-Info] Error", {cause: data.error});
            if (data.successful) {
                setToken({"token": data.token});
                onClose();
            } else {
                setError(data.error);
            }
        } catch (e) {
            console.log(e);
            setError(e.cause);
        }
    };

    useEffect(() => {
            if (isLoading) {
                save().then(async () => {
                    await loadStudentData();
                    setLoading(false);
                });
            }
        }, [isLoading]);

    const onFormSubmit = () => {
        console.log("Handling Submit");
        setLoading(true);
    }

    let schemaName;
    let label;

    switch(state) {
        case 0:
            schemaName = "firstName";
            label = "First Name";
            break;
        case 1:
            schemaName = "lastName";
            label = "Last Name";
            break;
        case 2:
            schemaName = "username";
            label = "Username";
            break;
        case 3:
            schemaName = "university";
            label = "University";
            break;
        case 4:
            schemaName = "major";
            label = "Major"
            break;

        case 5:
            schemaName = "canvasToken";
            label = "Canvas Token";
            break;
    }

    return (
                <div>
                    {error && (
                        <div className="text-danger">{error}</div>
                    )}
                    <Formik
                        validationSchema={singleFieldSchema(schemaName)}
                        onSubmit={onFormSubmit}
                        initialValues={{[schemaName]: ""}}
                    >
                        {({ handleSubmit, handleChange, handleBlur, values, touched, errors}) => (
                        <Form noValidate onSubmit={handleSubmit}>
                            <Form.Label>Change Your {label}</Form.Label>
                            {state === 4 && (
                                <Form.Select 
                                    aria-label={label}
                                    name={schemaName}
                                    defaultValue={values[schemaName]}
                                    onChange={(event) => {
                                        handleChange(event);
                                        setField(event.target.value);
                                    }}
                                    onBlur={handleBlur}
                                    isInvalid={touched[schemaName] && !!errors[schemaName]}
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
                            )}
                            {state !== 4 && (<Form.Control
                                    type="text"
                                    name={schemaName}
                                    value={values[schemaName]}
                                    placeholder={label}
                                    aria-label={label}
                                    aria-describedby="basic-addon1"
                                    onChange={(event) => {
                                        handleChange(event);
                                        setField(event.target.value);
                                    }}
                                    onBlur={handleBlur}
                                    isInvalid={touched[schemaName] && !!errors[schemaName]}
                                    //Longer Field Limit for Canvas Token Input
                                    maxLength={(state === 5) ? 70 : 32}
                                />)}
                            <Form.Control.Feedback type="invalid">{errors[schemaName]}</Form.Control.Feedback>
                            <Button
                                type="Submit"
                                variant="primary"
                                disabled={isLoading}
                            >
                                {isLoading ? "Loading..." : "Save"}
                            </Button>
                        </Form>
                        )}
                    </Formik>
                </div>
            );
}
export default SettingsEditWindow;