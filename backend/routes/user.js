const express = require('express');
const authenticateJWT = require('../middleware/auth');
const calculateSP = require('../services/calculateSP');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { User, Skill, SPTransaction, Notification, Class , UserSkill } = require('../models');
const { Op } = require('sequelize');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'profile_pictures');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.ID_Users}_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// POST /api/user/info
router.post('/info', authenticateJWT, upload.single('profile_picture'), async (req, res) => {
  const { Users_name, first_name, last_name, birthday, bio, telegram, discord } = req.body;

  try {
    const user = await User.findByPk(req.user.ID_Users);
    if (!user) return res.status(404).json({ message: `User not found ${req.user.ID_Users}` });

    // Check for unique username
    if (Users_name && Users_name !== user.Users_name) {
      const existingUser = await User.findOne({ where: { Users_name } });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken, please choose a different one.' });
      }
    }

    const updatedFields = {};

    if (Users_name && user.Users_name !== Users_name) updatedFields.Users_name = Users_name;
    if (first_name && user.first_name !== first_name) updatedFields.first_name = first_name;
    if (last_name && user.last_name !== last_name) updatedFields.last_name = last_name;
    if (birthday && user.birthday !== birthday) updatedFields.birthday = birthday;
    if (bio && user.bio !== bio) updatedFields.bio = bio;
    if (telegram && user.telegram !== telegram) updatedFields.telegram = telegram;
    if (discord && user.discord !== discord) updatedFields.discord = discord;

    // Handle photo upload and generate full public URL
    if (req.file) {
      const host = req.protocol + '://' + req.get('host');
      updatedFields.profile_picture = `${host}:80/uploads/profile_pictures/${req.file.filename}`;
    }

    if (Object.keys(updatedFields).length > 0) {
      await user.update(updatedFields);
      return res.status(200).json({
        message: `${Object.keys(updatedFields).length} field(s) updated.`,
        user,
      });
    } else {
      return res.status(200).json({ message: 'No changes detected.' });
    }

  } catch (error) {
    console.error('Error in /info:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
});




// POST /api/user/skills/learn
router.post('/skills/learn', authenticateJWT, async (req, res) => {
  const { learnSkills = [] } = req.body;

  if (learnSkills.length === 0) {
    return res.status(400).json({ message: 'At least one skill to learn is required.' });
  }

  try {
    const user = await User.findByPk(req.user.ID_Users);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let newSkills = 0;

    for (const skillName of learnSkills) {
      const [skill] = await Skill.findOrCreate({ where: { skills_name: skillName } });

      const exists = await UserSkill.findOne({
        where: { userId: user.ID_Users, skillId: skill.ID_skill, type: 'learn' },
      });

      if (!exists) {
        await UserSkill.create({
          userId: user.ID_Users,
          skillId: skill.ID_skill,
          type: 'learn',
        });
        newSkills++;
      }
    }

    if (newSkills >= 3) {
      await calculateSP(user.ID_Users, { type: 'skills', value: 3 });
    }

    return res.status(200).json({ message: 'Learn skills updated successfully.' });
  } catch (error) {
    console.error('Error in /skills/learn:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
});


// POST /api/user/skills/teach
router.post('/skills/teach', authenticateJWT, async (req, res) => {
  const { teachSkills = [] } = req.body;

  if (teachSkills.length === 0) {
    return res.status(400).json({ message: 'At least one skill to teach is required.' });
  }

  try {
    const user = await User.findByPk(req.user.ID_Users);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let newSkills = 0;

    for (const skillName of teachSkills) {
      const [skill] = await Skill.findOrCreate({ where: { skills_name: skillName } });

      const exists = await UserSkill.findOne({
        where: { userId: user.ID_Users, skillId: skill.ID_skill, type: 'teach' },
      });

      if (!exists) {
        await UserSkill.create({
          userId: user.ID_Users,
          skillId: skill.ID_skill,
          type: 'teach',
        });
        newSkills++;
      }
    }

    if (newSkills >= 3) {
      await calculateSP(user.ID_Users, { type: 'skills', value: 3 });
    }

    return res.status(200).json({ message: 'Teach skills updated successfully.' });
  } catch (error) {
    console.error('Error in /skills/teach:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
});



// GET /api/user/settings
router.get('/settings', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.ID_Users, {
      attributes: ['language', 'dark_mode', 'status']
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ settings: user });
  } catch (err) {
    console.error('[Settings Get Error]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/user/settings
router.put('/settings', authenticateJWT, async (req, res) => {
  const { language, dark_mode, status } = req.body;

  try {
    const user = await User.findByPk(req.user.ID_Users);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.language = language ?? user.language;
    user.dark_mode = dark_mode ?? user.dark_mode;
    user.status = status ?? user.status;

    await user.save();

    res.status(200).json({ message: 'Settings updated successfully', settings: user });
  } catch (err) {
    console.error('[Settings Update Error]', err);
    res.status(500).json({ message: 'Server error' });
  }
});





// Complete Profile Route
router.post('/complete-profile', authenticateJWT, async (req, res) => {
  const userId = req.user.ID_Users;

  try {
    const user = await User.findByPk(userId, {
      include: [Skill]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.profileCompleted) {
      return res.status(400).json({ message: 'Profile already completed.' });
    }

    if (!(user.username && user.firstName && user.lastName && user.age)) {
      return res.status(400).json({ message: 'Please complete your personal information first.' });
    }

    if (!user.Skills || user.Skills.length === 0) {
      return res.status(400).json({ message: 'Please select at least one skill.' });
    }

    user.spPoints += 5;
    user.profileCompleted = true;
    await user.save();

    await SPTransaction.create({
      userId: user.id,
      amount: 5,
      type: 'REWARD',
      reason: 'Profile Completion'
    });

    res.status(200).json({ message: 'Profile completed. 5 Swapa Points awarded!' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Get Notifications Route
router.get('/notifications', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.ID_Users;
    const notifications = await Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark Notification as Read Route
router.put('/notifications/:notificationId/read', authenticateJWT, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.ID_Users;

    const notification = await Notification.findOne({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Delete Notification Route
router.delete('/notifications/:notificationId', authenticateJWT, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.ID_Users;

    const notification = await Notification.findOne({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await notification.destroy();

    res.status(200).json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Get User's Courses Route
router.get('/courses',authenticateJWT, async (req, res) => {
  const userId = req.user.ID_Users;

  try {
    const courses = await Class.findAll({
      where: {
        [Op.or]: [
          { teacherId: userId },
          { studentId: userId }
        ]
      },
      include: [
        { model: Skill },
        { model: User, as: 'Teacher', attributes: ['id', 'username'] },
        { model: User, as: 'Student', attributes: ['id', 'username'] }
      ],
      order: [['date', 'DESC']]
    });

    res.status(200).json({ courses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
});

// Get User Profile Route
router.get('/profile', authenticateJWT,async (req, res) => {
  const userId =  req.user.ID_Users;

  try {
    const row = await User.findByPk(userId, {
      attributes: [
        'ID_Users',
        'Users_name',
        'first_name',
        'last_name',
        'email',
        'birthday',
        'bio',
        'profile_picture',
        'telegram',
        'discord',
        'rate',
        'location'
      ]
    });


    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }

    // map + calculate age
    const user = {
      id:               row.ID_Users,
      Users_name:       row.Users_name,
      first_name:       row.first_name,
      last_name:        row.last_name,
      email:            row.email,
      birthday:         row.birthday,          
      age:              calcAge(row.birthday),
      about:              row.bio,
      profile_picture:  row.profile_picture,
      telegram:         row.telegram,
      discord:          row.discord,
      rating:           row.rate,
      location:         row.location
    };

    res.json(user);
  } catch (err) {
    console.error("❌ Error fetching profile:", err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update User Profile Route
router.put('/profile', authenticateJWT, async (req, res) => {
  const userId = req.user.ID_Users;
  const { username, firstName, lastName, telegram, discord } = req.body;

  try {
    await User.update(
      { username, firstName, lastName,  telegram, discord},
      { where: { id: userId } }
    );

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error("❌ Error updating profile:", error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});



// helper to turn YYYY‑MM‑DD (or Date) into integer age
function calcAge(birthday) {
  const b = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  const m  = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) {
    age--;                       // not had birthday yet this year
  }
  return age;
}
// Get User Profile by ID Route
router.get('/profile/:userid', async (req, res) => {
  const { userid } = req.params;

  try {
    const row = await User.findByPk(userid, {
      attributes: [
        'ID_Users',
        'Users_name',
        'first_name',
        'last_name',
        'email',
        'birthday',
        'bio',
        'profile_picture',
        'telegram',
        'discord',
        'rate'
      ]
    });

    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }

    // map + calculate age
    const user = {
      id:           row.ID_Users,
      username:     row.Users_name,
      firstName:    row.first_name,
      lastName:     row.last_name,
      email:        row.email,
      birthday:     row.birthday,          
      age:          calcAge(row.birthday),
      about:        row.bio,
      avatarUrl:    row.profile_picture,
      telegram:     row.telegram,
      discord:      row.discord,
      rating:       row.rate
    };

    res.json(user);
  } catch (err) {
    console.error('GET /profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});



// update profile
router.post('/update-profile', authenticateJWT, async (req, res) => {
  const { Users_name, location, bio, telegram, discord, email } = req.body;

  try {
    const user = await User.findByPk(req.user.ID_Users);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const updatedFields = {};

    // Username uniqueness check
    if (Users_name && Users_name !== user.Users_name) {
      const existingUser = await User.findOne({ where: { Users_name } });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken.' });
      }
      updatedFields.Users_name = Users_name.trim();
    }

    // Email uniqueness check
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already in use.' });
      }
      updatedFields.email = email.trim();
    }

    if (location && user.location !== location) updatedFields.location = location.trim();
    if (bio && user.bio !== bio) updatedFields.bio = bio.trim();
    if (telegram && user.telegram !== telegram) updatedFields.telegram = telegram.trim();
    if (discord && user.discord !== discord) updatedFields.discord = discord.trim();

    // If something changed
    if (Object.keys(updatedFields).length > 0) {
      await user.update(updatedFields);
      const updatedUser = await User.findByPk(user.ID_Users); // refresh
      return res.status(200).json({
        message: `${Object.keys(updatedFields).length} field(s) updated.`,
        user: updatedUser,
      });
    }

    return res.status(200).json({ message: 'No changes detected.' });

  } catch (error) {
    console.error('Error in /update-profile:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
});

// get contact

router.get('/contacts', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.ID_Users; // assuming your JWT sets this

    const user = await User.findByPk(userId, {
      attributes: ['discord', 'telegram', 'email'] // select only these fields
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      discord: user.discord || '',
      telegram: user.telegram || '',
      email: user.email || '',
    });
  } catch (error) {
    console.error('Error fetching user contacts:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


// Upload Photo
router.post('/upload-profile-picture', authenticateJWT, upload.single('profile_picture'), async (req, res) => {
  try {
    const user = await User.findByPk(req.user.ID_Users);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }


      const host = req.protocol + '://' + req.get('host');
      const profileUrl = `${host}:80/uploads/profile_pictures/${req.file.filename}`;

    await user.update({ profile_picture: profileUrl });

    return res.status(200).json({
      message: 'Profile picture uploaded successfully.',
      profile_picture: profileUrl,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ message: 'Server error during upload.', error });
  }
});

module.exports = router;
