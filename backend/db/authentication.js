let bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

const key = process.env.AUTH_KEY;

if (!key) throw new Error('AUTH_KEY missing in .env file.');

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
    
// Decryps user token and returns username
const decryptToken = (token) => {
    try {
        const decoded = jwt.verify(token, key);
        // Return only the username
        return decoded.username;
    } catch (err) {
        return null;
    }
};
module.exports = {encryptPassword, verifyPassword, generateToken, verifyToken}