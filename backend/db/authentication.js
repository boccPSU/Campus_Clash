let bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

const key = process.env.AUTH_KEY;

const encryptPassword = (password) => {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    if (bcrypt.compareSync(password, hash)) {
        return hash;
    } else {
        console.log("Encryption Error.");
        return null;
    }
}

const verifyPassword = (password, hash) => {
    if (bcrypt.compareSync(password, hash)) {
        return true;
    } else {
        return false;
    }
}

const generateToken = (username) => {
    let data = {
        signInTime: Date.now(),
        username
    }
    const token = jwt.sign(data, key, {expiresIn: "1d"});
    return token;
}

const verifyToken = (token) => {
    const verified = jwt.verify(token, key);
    if (verified) {
        return true;
    } else {
        return false;
    }
}
module.exports = {encryptPassword, verifyPassword, generateToken, verifyToken}