const express = require("express");
const { userSignIn, userSignUp } = require("../app/controllers/user");

const router = express.Router();

router.post("/login", userSignIn);
router.get("/login", (req, res) => {
  const user = req.session?.isAuthenticate;
  if (user) {
    res.redirect("/");
  }
  res.render("login", { messages: req.flash("error") });
});

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    } else {
      res.redirect("/home");
    }
  });
});
router.get("/signup", (req, res) => {
  const user = req.session?.isAuthenticate;
  if (user) {
    res.redirect("/");
  }
  res.render("signup", { messages: req.flash("signupError") });
});
router.post("/signup", userSignUp);

// router.post("/sign-up", userSignUp);

module.exports = router;
