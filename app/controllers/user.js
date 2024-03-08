const User = require("../models/user");
const bcrypt = require("bcrypt");
const Sequelize = require("sequelize");
const { Op } = require("sequelize");
const flash = require("connect-flash");
const app = require("express")();
const nodemailer = require("nodemailer");
let genratedOtp;

const { mailFormat, generateOTP } = require("./otpmailformat");

const userSignUp = async function (req, res) {
  const { username, email, password, otp } = req.body;

  const adminBool = req.session.admin && req.body?.userType === "admin";
  try {
    const isUser = await User.findOne({ where: { email: email } });
    if (genratedOtp !== otp) {
      req.flash("error", "Invalid OTP ");
      return res.redirect("/user/signup");
    }
    if (isUser) {
      req.flash("error", "User already exit ");
      return res.redirect(`${req.originalUrl}`);
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
    req.session.isAuthenticate = true;
    req.session.admin = newUser.isAdmin;
    req.session.user = newUser;
    req.flash("success", "Signup successfully");
    return res.redirect("/home");
  } catch (error) {
    req.session.isAuthenticate = false;
    console.log("Error during sign-up", error);
    req.flash("error", "Unable to signup");
    return res.redirect(`${req.originalUrl}`);
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
    console.log("locals............", req);
    req.flash("success", "SignIn Successfully");

    return res.redirect("/home");
  } catch (error) {
    req.session.isAuthenticate = false;
    console.log("user login error", error);
    req.flash("error", "Something went wrong! unable to signIn");
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
    req.flash("success", "Sucess");
    res.redirect("/admin/manageuser");
  } catch (error) {
    console.log("unable to change user type", error);
    req.flash("error", "Something went wrong");
    res.status(400).json("Someting went wrong");
  }
}
async function userDelete(req, res) {
  try {
    const user = await User.findByPk(req.query.id);
    await user.destroy();
    req.flash("success", "User deleted successfully");
    res.redirect("/admin/manageuser");
  } catch (error) {
    console.log("unable to delete user", error);
    req.flash("error", "Something went wrong. unable to delete user");
    res.redirect("/admin/manageuser");
  }
}

async function sendEmail(req, res) {
  const { email } = req.body;
  genratedOtp = generateOTP();
  const transporter = nodemailer.createTransport({
    // host: "live.smtp.mailtrap.io",
    host: "live.smtp.mailtrap.io",
    port: 587,
    secure: false,
    auth: {
      user: "api",
      pass: "d8d654977b245c9ecc83c028b639a111",
    },
  });

  const info = await transporter.sendMail({
    // from: "info@mailtrap.com", // sender address
    from: "mailtrap@demomailtrap.com", // sender address
    // to: email, // list of receivers
    to: "goyallucky2020@gmail.com", // list of receivers
    subject: "Verifiction email", // Subject line
    text: genratedOtp,
    html: mailFormat(), // html body
  });
}
module.exports = {
  userSignIn,
  userSignUp,
  getUsers,
  changeUserType,
  userDelete,
  sendEmail,
};
