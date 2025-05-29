const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();
const { User } = require('../models');
const {sendMail} = require('../config/mailer'); 
const { contactMail } = require('../config/mailer');
const passport = require("passport");
const authController = require("../controllers/authController");
require('dotenv').config();

// Utils
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// REGISTER
router.post('/register', async (req, res) => {
  const {  first_name, last_name, email, password } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode= generateCode();

    const newUser = await User.create({
      first_name,
      last_name,
      email,
      password: hashedPassword,
      verificationCode,
      isVerified: false,
      status: 'EnLigne',
    });

 await sendMail(
  email,
  'Email Verification - SWAPA',
  `
Dear ${last_name} ${first_name},

Thank you for signing up with SWAPA, the Skills Exchange Platform.

To complete your registration, please use the verification code below:

🔐 Verification Code: ${verificationCode}

Enter this code in the verification field to confirm your email address and activate your account.

If you did not sign up for SWAPA,  please ignore this email or contact our support team.

Best regards,  
The SWAPA Team  
`
)
 .then(info => {
      console.log("Email sent:", info);
    })
    .catch(error => {
      console.error("Error sending email:", error);
    });
  
    return res.status(201).json({ 
      message: 'User registered. Check your email for the verification code.'
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// VERIFY EMAIL
router.post('/verify', async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user || user.verificationCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    user.isVerified = true;
    user.verificationCode = null;
    await user.save();
     const token = jwt.sign({ ID_Users: user.ID_Users }, process.env.JWT_SECRET_KEY, { expiresIn: '7h' });
    console.log("User ID:", user.ID_Users);
    console.log("JWT_SECRET_KEY:", process.env.JWT_SECRET_KEY);  // Make sure it's not undefined

    return res.status(200).json({ message: 'Email verified successfully.',token });
  } catch (err) {
    console.error('Verification error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !user.isVerified) {
      return res.status(401).json({ message: 'Invalid email or not verified.' });
    }
    if (user.status !== 'EnLigne') {
      user.status = 'EnLigne';
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });
      const complet = user.profileCompleted;
      const verified = user.isVerified;
     const token = jwt.sign({ ID_Users: user.ID_Users }, process.env.JWT_SECRET_KEY, { expiresIn: '7h' });
    console.log("User ID:", user.ID_Users);
    return res.status(200).json({ message: 'Login successful', token , complet ,verified });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// RECOVER PASSWORD
router.post('/recover', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const code = generateCode();
    user.resetCode = code;
    await user.save();

  
   await sendMail(
  email,
  'Password Reset Request - SWAPA',
  `
Dear user,

We received a request to reset your password for your SWAPA account.

🔐 Password Reset Code: ${code}

Please enter this code on the password reset page to proceed. If you did not request a password reset, please ignore this email or contact our support team.

For your security, this code will expire shortly.

Best regards,  
The SWAPA Team
`
)
 .then(info => {
      console.log("Email sent:", info);
    })
    .catch(error => {
      console.error("Error sending email:", error);
    });

    res.status(200).json({ message: 'Reset code sent to your email' });
  } catch (err) {
    console.error('Recover error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// VERIFY RESET CODE
router.post('/verify-reset-code', async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user || user.resetCode !== code) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    res.status(200).json({ message: 'Code verified. You may reset your password.' });
  } catch (err) {
    console.error('Verify code error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// UPDATE PASSWORD
router.post('/update-password', async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetCode = null; 
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Update password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});






// Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get( "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  authController.oauthSuccess
);

// Facebook OAuth
router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  authController.oauthSuccess
);


//contact mail
router.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
 const fullMessage = `
📬 New Contact Form Submission

Name: ${name}
Email: ${email}

Message:
${message}

––––––––––––––––––––––
This message was sent via the contact form on your website.
`;
await contactMail(email, fullMessage);

    res.status(200).json({ message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Error sending contact form:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});


module.exports = router;
