const express = require("express");
const {
  userSignIn,
  userSignUp,
  sendEmail,
} = require("../app/controllers/user");
const { checkLogin } = require("../middlewares/user");
const flash = require("connect-flash");
const router = express.Router();

// Sign-up
router.get("/signup", checkLogin(), (req, res) => {
  console.log(req.flash("error"));
  res.render("signup", {
    successMessage: req.flash("success"),
    errorMessage: req.flash("error"),
  });
});
router.post("/signup", userSignUp);

// sign-in
router.get("/login", checkLogin(), (req, res) => {
  res.render("login", {
    successMessage: req.flash("success"),
    errorMessage: req.flash("error"),
  });
});
router.post("/login", userSignIn);

// logout
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      // req.flash("error", "Something went wrong");
      console.error("Error destroying session:", err);
    } else {
      // req.flash("success", "Logout Successfully");
      res.redirect("/home");
    }
  });
  delete res.locals.user;
  delete res.locals.isAuthenticated;
});

router.post("/verifyemail", sendEmail);
module.exports = router;
