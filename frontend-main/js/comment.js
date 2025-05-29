module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('comment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    rating: {
      type: DataTypes.FLOAT, // ✅ Now allows decimal values like 3.55555
      allowNull: false,
      validate: {
        min: o,
        max: 5
      }
    }
  }, {
    tableName: 'comment',
    timestamps: false
  });

  return Comment;
};
