const express = require("express");
const {
  createBlog,
  blogDetails,
  deleteBlog,
  checkAuthBlog,
  getBlogDetails,
} = require("../app/controllers/blog");
const upload = require("../config/multer/index");
const Blogs = require("../app/models/blog");
const Sequelize = require("sequelize");
const isUser = require("../middlewares/user");

const router = express.Router();

router.get("/", async (req, res) => {
  const blogData = await blogDetails(req.query.id);

  if (!blogData) {
    res.redirect("/404");
  }
  const isAuthenticate =
    (await checkAuthBlog(req.session.user, req.query.id)) || false;
  res.render("blog", { blogData, isAuthenticate });
});

router.get("/create", isUser(), getBlogDetails);

router.post("/create", isUser(), upload.single("imageFile"), createBlog);

router.get("/delete", deleteBlog);

module.exports = router;
