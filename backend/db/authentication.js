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
    console.log("Generated token for", username, ":", token);
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

// Decrypts user token and returns username
const decryptToken = (token) => {  
  //console.log('[decryptToken] Decrypting token:', token);
  try {
    if (!token) {
      console.warn('[decryptToken] No token provided');
      return null;
    }

    const decoded = jwt.verify(token, key);
    if (!decoded || !decoded.username) {
      console.warn('[decryptToken] No username in decoded token', decoded);
      return null;
    }

    return decoded.username;
  } catch (err) {
    console.error('[decryptToken] Failed to verify token:', err.message);
    return null;
  }
};
module.exports = {encryptPassword, verifyPassword, generateToken, verifyToken, decryptToken}