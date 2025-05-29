require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");


const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    logging: false,
    dialectOptions: {
      connectTimeout: 10000,
    },
  }
);

// Import models
const User = require("./User")(sequelize, DataTypes);
const Skill = require("./Skill")(sequelize, DataTypes);
const UserSkill = require("./UserSkill")(sequelize, DataTypes);
const UserActivity = require("./UserActivity")(sequelize, DataTypes);
const Request = require("./request")(sequelize, DataTypes);
const Class = require("./class")(sequelize, DataTypes);
const TeachingSession = require("./teachingsession")(sequelize, DataTypes);
const Notification = require("./Notification")(sequelize, DataTypes);
const Comment = require("./comment")(sequelize, DataTypes);
const ClassFile = require("./Classfile")(sequelize, DataTypes);

// Associations
if (UserSkill.associate) {
  UserSkill.associate({ User, Skill });
}
Skill.belongsToMany(User, {
  through: "UserSkills",
  foreignKey: "skillId", // ce que tu as en base
  otherKey: "userId", // ce que tu as en base
  as: "Users",
});

User.belongsToMany(Skill, {
  through: "UserSkills",
  foreignKey: "userId", // ce que tu as en base
  otherKey: "skillId", // ce que tu as en base
  as: "Skills",
});

Request.belongsTo(User, { foreignKey: "sender_id", as: "Sender" });
Request.belongsTo(User, { foreignKey: "reciver_id", as: "Receiver" });
Request.belongsTo(Skill, { foreignKey: "skill_id" });

Class.belongsTo(Request, { foreignKey: "request_id" });
Class.belongsTo(User, { foreignKey: "sender_id", as: "Student" });
Class.belongsTo(User, { foreignKey: "reciver_id", as: "Teacher" });
Class.belongsTo(Skill, { as: "skill", foreignKey: "skill_id" });

// And in skill.js (if needed):
Skill.hasMany(Class, {
  foreignKey: "skill_id",
  as: "classes",
});
Comment.belongsTo(User, { foreignKey: "sender_id", as: "sender" });

module.exports = {
  sequelize,
  Sequelize,
  TeachingSession,
  DataTypes,
  User,
  Skill,
  UserSkill,
  UserActivity,
  Request,
  Class,
  Notification,
  Comment,
  ClassFile,
};
