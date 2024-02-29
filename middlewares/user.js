function isUser() {
  return (req, res, next) => {
    
    if (!req.session.isAuthenticate) {
      res.status(400).send({
        message: "unauthorized user",
      });
    }
    next();
  };
}

module.exports = isUser;
