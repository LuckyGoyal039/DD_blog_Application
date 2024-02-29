const User = require("../models/user");
const bcrypt = require("bcrypt");
const Sequelize = require("sequelize");
const { Op } = require("sequelize");
const flash = require("connect-flash");

const userSignUp = async function (req, res) {
  const { username, email, password } = req.body;
  const adminBool = req.session.admin
    ? req.body?.userType === "admin"
      ? true
      : false
    : false;
  try {
    const isUser = await User.findOne({ where: { email: email } });
    if (isUser) {
      req.flash("signupError", "Email already exit");
      return res.json({
        redirectUrl: "/user/signup",
      });
    }
    // saltRounds not working
    // const saltRounds = process.env.SALT_ROUNDS;
    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      userName: username,
      email: email,
      password: hashPassword,
      isAdmin: adminBool,
    });
    if (req.session?.user) {
      return res.status(200).json({ redirectUrl: "/home" });
    }

    req.session.isAuthenticate = true;
    req.session.admin = newUser.isAdmin;
    req.session.user = newUser;
    res.status(200).json({
      username: newUser.userName,
      email: newUser.email,
      redirectUrl: "/home",
    });
  } catch (error) {
    req.session.isAuthenticate = false;
    console.log("Error during sign-up", error);
    req.flash("signupError", "Something went wrong");
    return res.json({
      redirectUrl: "/user/signup",
    });
  }
};

const userSignIn = async function (req, res) {
  const { email, password } = req.body;
  try {
    const isUser = await User.findOne({ where: { email: email } });

    if (!isUser || !(await bcrypt.compare(password, isUser.password))) {
      req.session.isAuthenticate = false;
      req.flash("error", "Invalid email or password");
      return res.json({
        redirectUrl: "/user/login",
      });
    }
    req.session.isAuthenticate = true;
    req.session.admin = isUser.isAdmin;
    req.session.user = isUser;
    req.flash("message", "Successs");
    res.status(200).json({
      username: isUser.userName,
      email: isUser.email,
      redirectUrl: "/home",
    });
  } catch (error) {
    req.session.isAuthenticate = false;
    consle.log("user login error", error);
    req.flash("error", "Something went wrong");
    return res.json({
      redirectUrl: "/user/login",
    });
  }
};

async function getUsers(id) {
  const users = await User.findAll({
    where: {
      user_id: {
        [Sequelize.Op.ne]: id,
      },
    },
    attributes: { exclude: ["password"] },
  });

  return users;
}
async function changeUserType(req, res) {
  try {
    const userData = await User.findOne({
      where: {
        user_id: req.query.id,
      },
    });
    userData.set({
      isAdmin: !userData.isAdmin,
    });
    await userData.save();
    res.redirect("/admin/manageuser");
  } catch (error) {
    console.log("unable to change user type", error);
    res.status(400).json("Someting went wrong");
  }
}
async function userDelete(req, res) {
  try {
    const user = await User.findByPk(req.query.id);
    await user.destroy();
    res.redirect("/admin/manageuser");
  } catch (error) {
    console.log("unable to delete user", error);
    res.status(400).json("something went wrong");
  }
}
module.exports = {
  userSignIn,
  userSignUp,
  getUsers,
  changeUserType,
  userDelete,
};
