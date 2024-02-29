const sequelize = require("../../config/db/connection");
const { DataTypes } = require("sequelize");
const Category = require("./category");
const User = require("./user");

const Blogs = sequelize.define("Blog", {
  blog_id: {
    // type: DataTypes.UUID,
    // allowNull: false,
    // primaryKey: true,
    // defaultValue: DataTypes.UUIDV4,
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  blogTitle: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  blogText: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  image: {
    // type: DataTypes.BLOB("long"),
    type: DataTypes.STRING,
    allowNull: true,
    // defaultValue: "image link"
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // likes: {
  //   type: DataTypes.INTEGER,
  //   defaultValue: 0,
  // },
  // views: {
  //   type: DataTypes.INTEGER,
  //   defaultValue: 0,
  // },
  // comments: {
  //   type: DataTypes.JSON,
  //   // defaultValue:0
  // },
});

// Define associations
// Blogs.belongsTo(Category, { foreignKey: "categoryId", as: "categoryID" });

// UserEmployee.associate = (models) => {
//   // UserEmployee.belongsTo(models.user_tm, {foreignKey: 'ID', as: 'Employee'});
//   Blogs.belongsTo(User, { foreignKey: "use_id", onDelete: "CASCADE" });
// };
module.exports = Blogs;
