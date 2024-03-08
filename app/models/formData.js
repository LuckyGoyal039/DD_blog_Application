const sequelize = require("../../config/db/connection");
const { DataTypes } = require("sequelize");
const Blog = require("./blog");

const FormData = sequelize.define("formdata", {
  form_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  blogId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Blog,
      key: "blog_id",
    },
  },
});

FormData.belongsTo(Blog, { foreignKey: "blogId", onDelete: "CASCADE" });
module.exports = FormData;
