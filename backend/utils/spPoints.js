const db = require("../models");

const addPoints = async (userId, amount, reason) => {
  const user = await db.User.findByPk(userId);
  if (!user) throw new Error("User not found");

  user.spPoints += amount;
  await user.save();

  await db.SpTransaction.create({
    userId,
    type: "REWARD",
    amount,
    reason,
  });
};

module.exports = {
  addPoints,
};
