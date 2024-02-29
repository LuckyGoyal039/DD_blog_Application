const sequelize = require("../../config/db/connection");
const { DataTypes } = require("sequelize");

const AuditLog = sequelize.define("auditLog", {
  log_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userEmail: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  blogId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = AuditLog;
