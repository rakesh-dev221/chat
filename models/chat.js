"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Chat extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Room, { foreignKey: "room_id", targetKey: "id" })
    }
  }
  Chat.init(
    {
      // room_id: DataTypes.INTEGER,
      sender: DataTypes.STRING,
      message: DataTypes.STRING
    },
    {
      sequelize,
      modelName: "Chat",
    }
  );
  return Chat;
};
