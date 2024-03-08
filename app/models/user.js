const { DataTypes } = require("sequelize");
const dbConnect = require("../../config/db/connection");
const Blog = require("./blog");

const User = dbConnect.define("User", {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  userName: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: "eamil", // not working properly
  },

  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});
User.hasMany(Blog, { foreignKey: "userId", onDelete: "CASCADE" });
module.exports = User;
