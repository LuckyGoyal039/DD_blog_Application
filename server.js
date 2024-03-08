const User = require("./app/models/user");
const sequelize = require("./config/db/connection");
const path = require("path");
const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const ejs = require("ejs");
const routes = require("./routes");
const session = require("express-session");
const Blog = require("./app/models/blog");
const Roles = require("./app/models/roles");
const Permissions = require("./app/models/permission");
const AuditLog = require("./app/models/auditLogs");
const Category = require("./app/models/category");
const Comment = require("./app/models/comments");
const FormData = require("./app/models/formData");
require("dotenv").config();
const flash = require("connect-flash");

const app = express();
app.set("view engine", "ejs");

// app.set('views', path.resolve('./views'))
app.set("views", path.join(__dirname, "/app/views"));
app.use(cors());
app.use(express.static("./uploads"));
// app.use("/uploads", express.static(path.join(__dirname, "uploads"))); //not working

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash());
app.use("/", routes);

// sync user table
sequelize
  .sync()
  .then((result) => {
    console.log("All models synced successfully");
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Database synced failed: ", err);
  });
// https://hpbn.co/primer-on-latency-and-bandwidth/#speed-is-a-feature
// https://www.bacancytechnology.com/blog/joi-validation-in-nodejs-and-express
// https://sequelize.org/docs/v6/advanced-association-concepts/eager-loading/

// issues
// why all the models not sync without import

// title
// category ajax
// create tags
// summary  styling ck editor
// table: deserialize, id value

// feature image
// description

// save preview page
// comments on blog

// blog card: image, category as ribbun on image,
// gravitar

// comments

// any user login or not

// name

// text field xss/ sql inject free

// sprite image
// capta image

// save
// validate by user who write the blog

// mailtrap.io
