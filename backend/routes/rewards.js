const express = require('express');
const router = express.Router();
const { rewardTeachingSession } = require('../utils/rewards');

// POST /api/rewards/teaching
router.post('/teaching', async (req, res) => {
  const { userId, skillId, hours } = req.body;

  if (!userId || !skillId || !hours) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    await rewardTeachingSession(userId, skillId, hours);
    res.status(200).json({ message: 'Reward processed successfully.' });
  } catch (error) {
    console.error('Error in reward API:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;