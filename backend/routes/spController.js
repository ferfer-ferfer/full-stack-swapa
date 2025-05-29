const express = require('express');
const router = express.Router();
const { User } = require('../models');
const calculateSP = require('../services/calculateSP');
const authenticateJWT = require('../middleware/auth');

// Complétion du profil et attribution des SP via calculateSP
router.put('/complete-profile', authenticateJWT, async (req, res) => {
  

  try {
   
    const user = await User.findByPk(req.user.ID_Users);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.profileCompleted) {
      return res.status(400).json({ message: 'profile alredy completed' });
    }

    user.profileCompleted = true;
    await user.save();

    // Utiliser la fonction calculateSP
    await calculateSP(user.ID_Users, {
      type: 'profile-completion',
      value: 1
    });

    return res.status(200).json({ message: 'Profile completed ! +5 SP required.' });
  } catch (error) {
    console.error('Error while completing the profile. :', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});



// Vérifier le solde des SP

router.get("/balance", authenticateJWT, async (req, res) => {
  const userId = req.user.ID_Users;

  try {
    const jwt = require("jsonwebtoken");

const token = "your.jwt.token.here";
const decoded = jwt.decode(token);

console.log(decoded);
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log("user", user);

    return res.status(200).json({ spPoints: user.SP });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
