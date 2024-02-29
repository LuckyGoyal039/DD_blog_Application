const sequelize = require("../../config/db/connection");
const { DataTypes } = require("sequelize");

const Permissions = sequelize.define("permission", {
  permission_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  permissionType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Permissions;
