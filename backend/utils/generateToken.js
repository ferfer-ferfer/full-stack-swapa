const jwt = require("jsonwebtoken");

function generateToken(ID_Users) {
  return  jwt.sign({ ID_Users:ID_Users }, process.env.JWT_SECRET_KEY, { expiresIn: '7h' });
}


module.exports = generateToken;