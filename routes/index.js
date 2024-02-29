const express = require("express");
const router = express.Router();
const userRoutes = require("./userRoute");
const blogRoutes = require("./blogRoutes");
const { getBlogs, getAuditLogs } = require("../app/controllers/blog");
const {
  userSignUp,
  getUsers,
  changeUserType,
  userDelete,
} = require("../app/controllers/user");

router.get("/", (req, res) => {
  res.redirect("/home");
});
router.get("/home", getBlogs);

router.get("/404", (req, res) => {
  res.render("page404");
});

router.get("/admin/createUser", (req, res) => {
  if (req.session?.admin) {
    const admin = req.session.admin || false;
    res.render("createUser", { admin });
  } else {
    res.redirect("/404");
  }
});
router.post("/admin/createUser", userSignUp);

router.get("/admin/manageuser", async (req, res) => {
  if (req.session?.admin) {
    const users = await getUsers(req.session?.user?.user_id);
    res.render("manageUser", { users });
  } else {
    res.redirect("/404");
  }
});

router.get("/admin/changeusertype", changeUserType);
router.get("/admin/deteteuser", userDelete);
router.get("/admin/auditLogs", getAuditLogs);
router.use("/user", userRoutes);

router.use("/blog", blogRoutes);
module.exports = router;
