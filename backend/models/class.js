module.exports = (sequelize, DataTypes) => {
  const Class = sequelize.define('class', {
    ID_class: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    request_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    reciver_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    start_time: {
      type: DataTypes.DATE
    },
    end_time: {
      type: DataTypes.DATE
    },
    duration: {             // total duration allowed (in minutes, for example)
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    time_gone: {            // time elapsed so far (in same units as duration)
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isLessThanOrEqualDuration(value) {
          if (value > this.duration) {
            throw new Error('time_gone cannot be greater than duration');
          }
        }
      }
    },
    SP_N_P: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_teacher_ready: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_student_ready: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_paused:{
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    skill_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'class',
    timestamps: false
  });

  return Class;
};

