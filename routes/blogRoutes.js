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
const Blogs = require("../app/models/blog");
const Sequelize = require("sequelize");
const { isUser } = require("../middlewares/user");

const router = express.Router();

router.get("/", async (req, res) => {
  const blogData = await blogDetails(req.query.id);

  if (!blogData) {
    res.redirect("/404");
  }
  const isAuthenticate =
    (await checkAuthBlog(req.session.user, req.query.id)) || false;
  const admin = req.session?.admin || false;
  res.render("blog", { categories: [], blogData, isAuthenticate, admin });
});

router.get("/create", isUser(), async (req, res) => {
  const categoryPromise = await Blogs.findAll({
    attributes: [
      [Sequelize.fn("DISTINCT", Sequelize.col("category")), "category"],
    ],
  });
  res.render("createBlog", {
    categories: categoryPromise,
    messages: req.flash("createBlogError"),
  });
});

router.post("/create", isUser(), upload.single("imageFile"), createBlog);

router.get("/update", isUser(), getBlogDetails);
router.post("/update", isUser(), upload.single("imageFile"), updateBlog);

router.get("/delete", isUser(), deleteBlog);

module.exports = router;
