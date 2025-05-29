module.exports = (sequelize, DataTypes) => {
  const UserSkill = sequelize.define('UserSkill', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    skillId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('teach', 'learn'),
      allowNull: false,
      primaryKey: true,
    }
  }, {
    tableName: 'userskills',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'skillId', 'type'],
      }
    ]
  });

  UserSkill.associate = (models) => {
    UserSkill.belongsTo(models.User, { foreignKey: 'userId', targetKey: 'ID_Users' });
    UserSkill.belongsTo(models.Skill, { foreignKey: 'skillId', targetKey: 'ID_skill' });
  };

  return UserSkill;
};
