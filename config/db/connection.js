const Sequelize = require("sequelize");
require("dotenv").config();
const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbConnect = new Sequelize(dbName, dbUser, dbPassword, {
  host: "localhost", //default server
  dialect: "mysql", // dbms type
});

module.exports = dbConnect;
