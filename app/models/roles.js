const sequelize = require("../../config/db/connection");
const { DataTypes } = require("sequelize");

const Roles = sequelize.define("role", {
  role_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  roleType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Roles;
