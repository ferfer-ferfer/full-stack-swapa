const generateToken = require('../utils/generateToken'); // adjust path if needed

exports.oauthSuccess = (req, res) => {
  try {
    const user = req.user;
    const token = generateToken(user.ID_Users); // Assuming user.ID_Users is the unique identifier for the user
    const isNew = user?.newUser ? "true" : "false";


    // Redirect with both token and newUser=true/false
    const clientURL = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientURL}/auth-success.html?token=${token}&newUser=${isNew}`);
  } catch (err) {
    console.error("OAuth success handling failed:", err);
    res.redirect(`${process.env.CLIENT_URL}/auth-success.html?error=OAuth%20handling%20failed`);
  }
};
