function isUser() {
  return (req, res, next) => {
    if (!req.session.isAuthenticate) {
      req.flash("error", "Access denied");
      return res.redirect("/home");
    }
    next();
  };
}
function checkLogin() {
  return (req, res, next) => {
    if (req.session?.user) {
      req.flash("error", "Already signIn. please logout first");
      return res.redirect("/home");
    }
    next();
  };
}

function checkAdmin() {
  return (req, res, next) => {
    if (!req.session?.admin) {
      req.flash("error", "Access denied");
      return res.redirect("/home");
    }
    next();
  };
}

module.exports = { isUser, checkLogin, checkAdmin };
