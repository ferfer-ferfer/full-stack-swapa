const express = require('express');
const router = express.Router();
const { Skill, User,UserSkill } = require('../models');
const { Op } = require('sequelize');
const authenticateJWT = require('../middleware/auth');

// Add skill to the user's profile
router.post('/add-skill', authenticateJWT, async (req, res) => {
  const { skill, type } = req.body;


  try {
    const user = await User.findByPk(req.user.ID_Users);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const [skillRecord] = await Skill.findOrCreate({ where: { skills_name: skill } });

    const exists = await UserSkill.findOne({
      where: {
        userId: user.ID_Users,
        skillId: skillRecord.ID_skill,
        type: type,
      },
    });

    if (exists) {
      return res.status(200).json({ message: `Skill already exists for ${type}.` });
    }

    await UserSkill.create({
      userId: user.ID_Users,
      skillId: skillRecord.ID_skill,
      type: type,
    });

    return res.status(200).json({
      message: `Skill added successfully for ${type}.`,
      id: skillRecord.ID_skill,
      name: skillRecord.skills_name,
    });
  } catch (error) {
    console.error('Error in /skills:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
});

// Remove skill from the user's profile
router.delete('/remove-skill/:skillId', authenticateJWT, async (req, res) => {
  const { skillId } = req.params;
  const { type } = req.query; // Expecting 'teach' or 'learn'

  // Validate 'type' query parameter
  if (!type || !['teach', 'learn'].includes(type)) {
    return res.status(400).json({ message: "Query parameter 'type' is required and must be either 'teach' or 'learn'." });
  }

  try {
    const userId = req.user.ID_Users;

    // Attempt to delete the UserSkill entry matching userId, skillId, and type
    const deletedCount = await UserSkill.destroy({
      where: {
        userId: userId,
        skillId: skillId,
        type: type
      }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ message: 'No matching skill found for this user and type.' });
    }

    res.status(200).json({ message: 'Skill removed successfully.' });
  } catch (error) {
    console.error('Remove skill error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});



// Search for skills based on a search query
router.get('/search-skills', async (req, res) => {
  const { search } = req.query;

  try {
    const skills = await Skill.findAll({
      where: {
        name: {
          [Op.like]: `%${search || ''}%`, // Match skills based on the search query
        },
      },
    });

    res.status(200).json(skills);
  } catch (err) {
    console.error('Search skills error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
//get personnol skills
router.get('/skills', authenticateJWT, async (req, res) => {
  const userid = req.user.ID_Users;

  try {
    const rows = await UserSkill.findAll({
      where: { userId: userid },
      include: [{ model: Skill, attributes: ['skills_name','ID_skill' ] }],
      raw: true,
    });

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User skills not found' });
    }

    const teaching = [];
    const learning = [];

    rows.forEach(r => {
      const skillName = r['Skill.skills_name'];
      if (r.type === 'teach') teaching.push(skillName);
      else if (r.type === 'learn') learning.push(skillName);
    });
res.json({
  teaching: rows
    .filter(r => r.type === 'teach')
    .map(r => ({
      name: r['Skill.skills_name'],
      id: r['Skill.ID_skill']
    })),
  learning: rows
    .filter(r => r.type === 'learn')
    .map(r => ({
      name: r['Skill.skills_name'],
      id: r['Skill.ID_skill']
    }))
});
  } catch (err) {
    console.error('GET skills error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


//get skills for user
router.get('/skills/:userid', async (req, res) => {
  const { userid } = req.params;

  try {
    const rows = await UserSkill.findAll({
      where: { userId: userid },
      include: [{ model: Skill, attributes: ['skills_name'] }], 
      raw: true, 
    });

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User skills not found' });
    }

   
    const teaching = [];
    const learning = [];

    rows.forEach(r => {
      const skillName = r['Skill.skills_name'];
      if (r.type === 'teach') teaching.push(skillName);
      else if (r.type === 'learn') learning.push(skillName);
    });
    res.json({ teaching, learning });
  } catch (err) {
    console.error('GET skills error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
