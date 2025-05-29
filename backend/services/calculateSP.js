const { User, UserActivity } = require('../models');


const calculateSP = async (userId, activity) => {
  let spEarned = 0;
  const hours = activity.value;

  try {
    if (activity.type === 'profile-completion') {
      spEarned = 5;

    } else if (activity.type === 'teaching') {
      // Bonuses based on specific hours
      if (hours === 0.25) spEarned += 1;
      if (hours === 4) spEarned += 4;
      if (hours === 12) spEarned += 9;

      // Daily bonus
      if (activity.timeFrame === 'day' && hours >= 4) {
        spEarned += 10;
      }

      // Weekly bonus
      if (activity.timeFrame === 'week' && hours >= 15) {
        spEarned += 15;
      }

      // General rate
      spEarned += 7 * hours;

    } else if (activity.type === 'learning') {
      spEarned = 7 * hours;

    } else if (activity.type === 'applications') {
      // Check if user accepted 5 requests
      if (activity.value >= 5) {
        spEarned = 3;
      }

    } else if (activity.type === 'skills') {
      const skills = activity.value; // Number of distinct skills taught
      if (skills >= 3) {
        spEarned = 6;
      }
    }

    // Save UserActivity
const existingActivity = await UserActivity.findOne({
  where: {
    userId,
    activityType: activity.type,
    value: activity.value,
  },
});

if (!existingActivity) {
  await UserActivity.create({
    userId,
    activityType: activity.type,
    value: activity.value,
    spEarned,
  });


    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");

    user.SP += spEarned;

    if (activity.type === 'teaching') {
      user.total_time_teaching_h += hours;
    } else if (activity.type === 'learning') {
      user.total_time_learning_h += hours;
    }

          await user.save();

      //  Create Notification
      await Notification.create({
        userId: userId,
        message: ` You earned ${spEarned} SP for ${activity.type.replace('-', ' ')}!`,
        isRead: false
      });
    return spEarned;
}else{
  console.log('Activity already exists for this user:', existingActivity);
  return 0;
}
  } catch (error) {
    console.error('SP Calculation Error:', error);
    return 0;
  }
};

module.exports = calculateSP;
