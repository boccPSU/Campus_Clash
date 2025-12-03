import * as yup from "yup";

const schema = {
            firstName: yup.string()
                .max(32, "Your first name cannot exceed 32 characters.")
                .matches(/^[A-Za-z'-]*$/, "Please enter your name without special characters.")
                .required("Please enter your first name."),
            lastName: yup.string()
                .max(32, "Your last name cannot exceed 32 characters.")
                .matches(/^[A-Za-z'-]*$/, "Please enter your name without special characters.")
                .required("Please enter your last name."),
            username: yup.string()
                .min(6, "Your username must be 6-32 characters long.")
                .max(32, "Your username must be 6-32 characters long.")
                .matches(/^[A-Za-z0-9'-_]*$/, "Please enter a username without special characters.")
                .required("Please enter your username."),
            password: yup.string()
                .min(8, "Your password must be 8-20 characters long.")
                .max(20, "Your password must be 8-20 characters long.")
                .required("Please enter a password.")
                .matches(/[a-z]/, "Password must contain at lease one lowercase letter.")
                .matches(/[A-Z]/, "Password must contain at least one uppercase letter.")
                .matches(/[0-9]/, "Password must contain at least one number.")
                .matches(/[^a-zA-Z0-9]/, "Password must contain at least one special character."),
            university: yup.string()
                        .max(32, "Your first name cannot exceed 32 characters.")
                        .matches(/^[A-Za-z'-]*$/, "Please enter the name of your University without special characters.")
                        .required("Please enter the name of your University."),
            major: yup.string()
                .required("Please select your Major."),
            canvasToken: yup.string()
                .required("Please enter your Canvas Token."),
        };

export function singleFieldSchema(fieldName) {
    return yup.object({ [fieldName]: schema[fieldName]});
}
export default function validationSchema() {
    return  yup.object(schema);
}