// models/request.js
module.exports = (sequelize, DataTypes) => {
    const Request = sequelize.define('request', {
      ID_request: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      message: {
        type: DataTypes.TEXT,
      },
      status_request: {
        type: DataTypes.STRING,
        defaultValue: 'pending'
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    }, {
      timestamps: false,
      tableName: 'request'
    });
  
    Request.associate = (models) => {
      Request.belongsTo(models.Users, { foreignKey: 'sender_id', as: 'Sender' });
      Request.belongsTo(models.Users, { foreignKey: 'reciver_id', as: 'Receiver' });
      Request.belongsTo(models.skill, { foreignKey: 'skill_id' });
    };
  
    return Request;
  };
  