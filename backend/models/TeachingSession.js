module.exports = (sequelize, DataTypes) => {
    const TeachingSession = sequelize.define('TeachingSession', {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      skill_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      hours: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    }, {
      tableName: 'TeachingSessions', // Replace with actual table name if different
      timestamps: false,
    });
  
    return TeachingSession;
  };
  