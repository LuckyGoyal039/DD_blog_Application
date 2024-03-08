const express = require("express");
const {
  createBlog,
  blogDetails,
  deleteBlog,
  checkAuthBlog,
  getBlogDetails,
  updateBlog,
} = require("../app/controllers/blog");
const upload = require("../config/multer/index");
const Blog = require("../app/models/blog");
const Sequelize = require("sequelize");
const { isUser } = require("../middlewares/user");
const Category = require("../app/models/category");
const Tag = require("../app/models/tags");
const {
  addComment,
  changeApproveStatus,
  deleteComment,
} = require("../app/controllers/comment");

const router = express.Router();

router.get("/", async (req, res) => {
  const blogData = await blogDetails(req.query.id, req.session?.user);

  if (!blogData) {
    res.redirect("/404");
  }
  const isAuthenticate =
    (await checkAuthBlog(req.session.user, req.query.id)) || false;
  const admin = req.session?.admin || false;
  res.render("blog", {
    categories: [],
    blogData,
    isAuthenticate,
    admin,
    user: req.session?.user || undefined,
    successMessage: req.flash("success"),
    errorMessage: req.flash("error"),
  });
});

router.get("/create", isUser(), async (req, res) => {
  const categoryPromise = await Category.findAll();
  const tagPromise = await Tag.findAll();
  res.render("createBlog", {
    categories: categoryPromise,
    tags: tagPromise,
    successMessage: req.flash("success"),
    errorMessage: req.flash("error"),
  });
});

router.post("/create", isUser(), upload.single("imageFile"), createBlog);

router.get("/update", isUser(), getBlogDetails);
router.post("/update", isUser(), upload.single("imageFile"), updateBlog);

router.get("/delete", isUser(), deleteBlog);
router.post("/addcomment", addComment);

router.get("/comment/approve", changeApproveStatus);
router.get("/comment/delete", deleteComment);

module.exports = router;
