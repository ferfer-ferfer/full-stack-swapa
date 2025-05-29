const { Op } = require('sequelize');
const { User, TeachingSession, RewardsLog } = require('../models');

const TEACHING_SP_REWARD = 10;
const WEEKLY_HOURS_THRESHOLD = 5;
const WEEKLY_BONUS_SP = 30;
const SKILL_MILESTONE_COUNT = 3;
const SKILL_MILESTONE_SP = 50;

// Add SP to a user
async function addSP(userId, amount) {
  await User.increment({ SP: amount }, { where: { ID_Users: userId } });
}

// Log a teaching session
async function logTeachingSession(userId, skillId, hours) {
  await TeachingSession.create({
    user_id: userId,
    skill_id: skillId,
    hours,
    date: new Date(),
  });
}

// Check if user qualifies for weekly hours bonus
async function checkWeeklyHours(userId) {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday
  startOfWeek.setHours(0, 0, 0, 0);

  const total = await TeachingSession.sum('hours', {
    where: {
      user_id: userId,
      date: {
        [Op.gte]: startOfWeek,
      },
    },
  });

  if (total >= WEEKLY_HOURS_THRESHOLD) {
    const alreadyRewarded = await RewardsLog.findOne({
      where: {
        user_id: userId,
        type: 'weekly_bonus',
        date: {
          [Op.gte]: startOfWeek,
        },
      },
    });

    if (!alreadyRewarded) {
      await addSP(userId, WEEKLY_BONUS_SP);
      await RewardsLog.create({
        user_id: userId,
        type: 'weekly_bonus',
        date: new Date(),
      });
    }
  }
}

// Check if user has taught 3 different skills
async function checkSkillMilestone(userId) {
  const result = await TeachingSession.findAll({
    where: { user_id: userId },
    attributes: ['skill_id'],
    group: ['skill_id'],
  });

  if (result.length >= SKILL_MILESTONE_COUNT) {
    const alreadyRewarded = await RewardsLog.findOne({
      where: {
        user_id: userId,
        type: 'skill_milestone',
      },
    });

    if (!alreadyRewarded) {
      await addSP(userId, SKILL_MILESTONE_SP);
      await RewardsLog.create({
        user_id: userId,
        type: 'skill_milestone',
        date: new Date(),
      });
    }
  }
}

// Main function to call after a teaching session
async function rewardTeachingSession(userId, skillId, hours) {
  await addSP(userId, TEACHING_SP_REWARD);
  await logTeachingSession(userId, skillId, hours);
  await checkWeeklyHours(userId);
  await checkSkillMilestone(userId);
}

module.exports = {
  rewardTeachingSession,
};
