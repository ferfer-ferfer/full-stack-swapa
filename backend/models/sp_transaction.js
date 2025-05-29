module.exports = (sequelize, DataTypes) => {
    const SPTransaction = sequelize.define('SPTransaction', {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM('REWARD', 'DEDUCTION'),
        allowNull: false
      },
      reason: {
        type: DataTypes.STRING,
        allowNull: false
      }
    });
  
    SPTransaction.associate = models => {
      SPTransaction.belongsTo(models.User, { foreignKey: 'userId' });
    };
  
    return SPTransaction;
  };
  