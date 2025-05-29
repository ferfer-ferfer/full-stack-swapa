const express = require('express');
const router = express.Router();
const { User, Skill } = require('../models');
const { Op } = require('sequelize');

router.get('/search', async (req, res) => {
  const search = req.query.skill;

  try {
    const skills = await Skill.findAll({
      where: {
        skills_name: { [Op.like]: `%${search}%` }
      },
      include: [{
        model: User,
        as: 'Users',
        attributes: ['ID_Users', 'Users_name', 'first_name', 'last_name', 'rate', 'profile_picture','email','telegram','discord'],
        through: {
          attributes: ['type'],  
          where: { type: 'teach' }
        }
      }]
    });

    const users = [];

    for (const skill of skills) {
      for (const user of skill.Users) {
        let existingUser = users.find(u => u.id === user.ID_Users);

        if (!existingUser) {
          // Get all skills this user teaches
          const userSkills = await Skill.findAll({
            include: [{
              model: User,
              as: 'Users',
              where: { ID_Users: user.ID_Users },
              through: {
                attributes: ['type'],
                where: { type: 'teach' }
              }
            }],
            attributes: ['skills_name']
          });

          users.push({
            id: user.ID_Users,
            username: user.Users_name,
            firstName: user.first_name,
            lastName: user.last_name,
            skills: userSkills.map(s => s.skills_name),
            rating: user.rate ,
            image : user.profile_picture,
            email: user.email,
            telegram: user.telegram,
            discord: user.discord
          });
        }
      }
    }
    res.json(users);
  } catch (err) {
    console.error('Skill search error:', err);
    res.status(500).json({ error: 'Something went wrong during skill search.' });
  }
});


module.exports = router;
