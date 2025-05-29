module.exports = (sequelize, DataTypes) => {
    const UserActivity = sequelize.define('UserActivity', {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      activityType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      value: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      spEarned: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    }, {
      tableName: 'useractivity',
    });
  
    
    return UserActivity;
  };
  