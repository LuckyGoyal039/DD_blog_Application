const sequelize = require("../../config/db/connection");
const { DataTypes } = require("sequelize");
const Blogs = require('./blog'); 

const Category = sequelize.define("category", {
  category_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Define associations
// Category.hasMany(Blogs, { foreignKey: 'category_id'});

module.exports = Category;
