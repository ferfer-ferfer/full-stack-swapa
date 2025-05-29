module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    ID_notification: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
      userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  }, {
    tableName: 'notifications',  
    timestamps: false,            
  })

  return Notification;
};
