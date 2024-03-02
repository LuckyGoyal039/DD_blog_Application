const Blogs = require("../models/blog");
const User = require("../models/user");
const Sequelize = require("sequelize");
const { Op } = require("sequelize");
const crypto = require("crypto");
const AuditLog = require("../models/auditLogs");
const fs = require("fs");
const path = require("path");

async function updateBlog(req, res) {
  const { title, content, category } = req.body;
  const userId = req.session.user.user_id;
  const userEmail = req.session.user.email;
  const decryptedId = decrypt(req.body?.blogId);
  const blogData = await Blogs.findOne({
    where: {
      blog_id: decryptedId,
    },
  });
  if (req.file?.filename && blogData.dataValues.image !== "noImage.jpg") {
    const imageName = blogData.dataValues.image;
    const uploadDir = path.join(__dirname, "..", "..", "uploads");
    const imagePath = path.join(uploadDir, imageName);
    fs.unlink(imagePath, (err) => {
      console.log("path/file.txt was deleted");
    });
  }
  const updatedImage = req.file?.filename || blogData.image;

  blogData.set({
    blogTitle: title,
    blogText: content,
    category: category,
    image: updatedImage,
  });
  await blogData.save();
  await updateAuditLogs(userEmail, blogData.blog_id, "Update");
}

async function createBlog(req, res) {
  try {
    const { title, content, category } = req.body;
    const userId = req.session.user.user_id;
    const userEmail = req.session.user.email;
    const image = req.file?.filename || "noImage.jpg";
    const newFile = await Blogs.create({
      blogTitle: title,
      blogText: content,
      category: category,
      userId: userId,
      image: image,
    });
    await updateAuditLogs(userEmail, newFile.blog_id, "Create");

    req.flash("createBlogSuccess", "Blog Created");
    return res.json({
      redirectUrl: "/",
    });
  } catch (error) {
    console.log("create blog error", error);
    req.flash("createBlogError", "Somethig went wrong!! unable to create blog");
    return res.json({
      redirectUrl: "/blog/create",
    });
  }
}

async function blogDetails(id) {
  const decryptedId = decrypt(id);
  try {
    const blogPromise = await Blogs.findOne({
      where: { blog_id: decryptedId },
    });
    const userPromise = await User.findOne();
    const [data, user] = await Promise.all([blogPromise, userPromise]);

    const BlogDetails = async () => {
      let user = await User.findOne({ where: { user_id: data.userId } });
      data.dataValues.blog_id = encrypt(`${data.dataValues.blog_id}`);
      return { ...data.dataValues, author: user.userName };
    };
    const details = await BlogDetails();

    return details;
  } catch (error) {
    console.log("blog details error", error);
    return false;
  }
}

async function updateAuditLogs(userEmail, blogId, action) {
  try {
    await AuditLog.create({
      userEmail,
      blogId,
      action,
    });
    return true;
  } catch (error) {
    console.log("Auditlog error", error);
    return false;
  }
}

async function deleteBlog(req, res) {
  try {
    const blogId = decrypt(req.query.id);
    const userEmail = req.session.user.email;
    const post = await Blogs.findByPk(blogId);

    if (!post) {
      return res.status(404).json({ error: "Blog not found" });
    }
    const imageName = post.image;
    const uploadDir = path.join(__dirname, "..", "..", "uploads");
    const imagePath = path.join(uploadDir, imageName);

    fs.unlink(imagePath, (err) => {
      if (err) throw err;
      console.log("path/file.txt was deleted");
    });
    const auditRes = await updateAuditLogs(userEmail, post.blog_id, "Delete");

    await post.destroy();

    res.redirect("/home");
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ error: "Error deleting blog" });
  }
}
const iv = Buffer.from("0123456789abcdef0123456789abcdef", "hex");
const key = Buffer.from(
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "hex"
);

const algorithm = "aes-256-cbc";
// encryption
function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}
function decrypt(encryptedText) {
  try {
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.log(error);
    return "error";
  }
}

async function fetchBlogData(filterQuery, page = 1, limit = 8) {
  const offset = (page - 1) * limit;

  const whereCondition = filterQuery
    ? {
        [Op.or]: [
          { category: { [Op.like]: `%${filterQuery}%` } },
          { blogTitle: { [Op.like]: `%${filterQuery}%` } },
        ],
      }
    : {};
  const allBlogs = await Blogs.findAll({
    where: whereCondition,
    limit: limit,
    offset: offset,
  });
  const BlogDetails = await Promise.all(
    allBlogs.map(async (ele, ind) => {
      let user = await User.findOne({ where: { user_id: ele.userId } });
      ele.dataValues.blog_id = encrypt(`${ele.dataValues.blog_id}`);
      return { ...ele.dataValues, author: user.userName };
    })
  );
  return BlogDetails;
}

async function fetchCategoryData() {
  return await Blogs.findAll({
    attributes: [
      [Sequelize.fn("DISTINCT", Sequelize.col("category")), "category"],
    ],
  });
}

async function totalBlogs(filterQuery) {
  const whereCondition = filterQuery
    ? {
        [Op.or]: [
          { category: { [Op.like]: `%${filterQuery}%` } },
          { blogTitle: { [Op.like]: `%${filterQuery}%` } },
        ],
      }
    : {};
  return await Blogs.count({ where: whereCondition });
}

async function getBlogs(req, res) {
  try {
    let isAuthenticate = req.session.isAuthenticate;
    let loading = true;
    let filterQuery = req.query?.filter;
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    if (filterQuery === "All") filterQuery = undefined;
    // Get Blog Data
    const BlogDetails = await fetchBlogData(filterQuery, page, limit);
    // get category List
    const allCategory = await fetchCategoryData();
    // get blog count
    const blogCount = await totalBlogs(filterQuery);
    const totalPages = Math.ceil(blogCount / limit);

    loading = false;
    res.render("home", {
      isAuthenticate,
      blogList: BlogDetails,
      loading: loading,
      categories: allCategory,
      currentPage: page,
      totalPages: totalPages,
      admin: req.session?.admin || false,
      messages: "",
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function checkAuthBlog(user, id) {
  try {
    const decryptId = decrypt(id);
    const blog = await Blogs.findOne({
      where: { blog_id: decryptId },
    });
    if (!blog) return false;
    const result = blog.userId === user?.user_id || user?.isAdmin;
    return result;
  } catch (error) {
    console.error("Error checking blog authorization:", error);
    return false;
  }
}

async function getAuditLogs(req, res) {
  const data = await AuditLog.findAll();
  const admin = req.session?.admin || false;
  const isAuthenticate = req.session?.isAuthenticate || false;
  res.render("auditLogs", { categories: [], data, admin, isAuthenticate });
}
async function getBlogDetails(req, res) {
  const categoryPromise = await Blogs.findAll({
    attributes: [
      [Sequelize.fn("DISTINCT", Sequelize.col("category")), "category"],
    ],
  });
  const id = decrypt(req.query.id);
  let blogContent = null;
  let result = id ? await Blogs.findOne({ where: { blog_id: id } }) : undefined;
  if (result) {
    blogContent = { ...result };
    blogContent.dataValues.blog_id = encrypt(`${id}`);
  }
  res.render("createBlog", {
    categories: categoryPromise,
    blogContent,
    messages: req.flash("createBlogError"),
  });
}
module.exports = {
  createBlog,
  blogDetails,
  deleteBlog,
  getBlogs,
  checkAuthBlog,
  getAuditLogs,
  getBlogDetails,
};
