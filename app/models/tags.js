const sequelize = require("../../config/db/connection");
const { DataTypes } = require("sequelize");

const Tag = sequelize.define("tag", {
  tag_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tagname: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

module.exports = Tag;
