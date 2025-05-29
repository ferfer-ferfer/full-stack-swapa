module.exports = (sequelize, DataTypes) => {
  const Skill = sequelize.define('Skill', {
    ID_skill: { 
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    skills_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  }, {
      tableName: 'skill',
    });

  Skill.associate = (models) => {
    Skill.belongsToMany(models.User, {
      through: models.UserSkill,
      foreignKey: 'skillId',
      otherKey: 'userId',
      as: 'Users'
    })
  };


  return Skill;
};

