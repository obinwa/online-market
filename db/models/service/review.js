const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = function (sequelize, DataTypes) {
  const Review = sequelize.define(
    "Review",
    {
      id:{
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      customerRating:{
        type: DataTypes.INTEGER,
      },
      customerComment:{
        type: DataTypes.TEXT,
      },
      artisanRating:{
        type: DataTypes.INTEGER,
      },
      artisanComment:{
        type: DataTypes.TEXT,
      },
      
      taskId:{
        type: DataTypes.INTEGER,
        references: {
          model: 'Task',
          key: "id",
        },
        onDelete:"SET NULL"
      },
    },
    {
      sequelize,
      name: {
        singular: "review",
        plural: "reviews",
      },
      tableName: "Review",
      timestamps: false,
    }
  );

  Review.associate = function (models) {
    Review.belongsTo(models.Task, { foreignKey: "taskId" });
  };

  return Review;
}