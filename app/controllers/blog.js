const Blogs = require("../models/blog");
const User = require("../models/user");
const Sequelize = require("sequelize");
const { Op } = require("sequelize");
const crypto = require("crypto");
const AuditLog = require("../models/auditLogs");
const fs = require("fs");
const path = require("path");

async function createBlog(req, res) {
  const { title, content, category } = req.body;
  const userId = req.session.user.user_id;
  const userEmail = req.session.user.email;
  try {
    if (req.body?.blogId) {
      const decryptedId = decrypt(req.body.blogId);
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
          if (err) throw err;
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
      const auditRes = await updateAuditLogs(
        userEmail,
        blogData.blog_id,
        "Update"
      );
    } else {
      const newFile = await Blogs.create({
        blogTitle: title,
        blogText: content,
        category: category,
        userId: userId,
        image: req.file?.filename || "noImage.jpg",
      });

      const auditRes = await updateAuditLogs(
        userEmail,
        newFile.blog_id,
        "Create"
      );
    }
    res.status(200).json({
      message: "Blog created successfully",
      redirectUrl: "/home",
    });
  } catch (error) {
    console.log("create blog error", error);
    res
      .status(500)
      .json({ errMess: "something went wrong. Unable to create blog" });
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
const iv = crypto.randomBytes(16);
const key = crypto.randomBytes(32);
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

async function getBlogs(req, res) {
  let isAuthenticate = req.session.isAuthenticate;
  let loading = true;
  const filterQuery = req.query.filter || "All";
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const offset = (page - 1) * limit;
    const whereCondition =
      filterQuery === "All" || filterQuery === ""
        ? {}
        : {
            [Op.or]: [
              {
                category: {
                  [Op.like]: `%${filterQuery}%`,
                },
              },
              {
                blogTitle: {
                  [Op.like]: `%${filterQuery}%`,
                },
              },
            ],
          };
    const countPromise = Blogs.count({ where: whereCondition });
    const allBlogsPromise =
      filterQuery === "All" || filterQuery === ""
        ? Blogs.findAll({
            limit: limit,
            offset: offset,
          })
        : Blogs.findAll({
            where: whereCondition,
            limit: limit,
            offset: offset,
          });
    // category List/
    const categoryPromise = Blogs.findAll({
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("category")), "category"],
      ],
    });

    // Wait for all asynchronous operations to complete
    const [count, allBlogs, categories] = await Promise.all([
      countPromise,
      allBlogsPromise,
      categoryPromise,
    ]);
    const totalPages = Math.ceil(count / limit);
    const BlogDetails = await Promise.all(
      allBlogs.map(async (ele, ind) => {
        let user = await User.findOne({ where: { user_id: ele.userId } });
        ele.dataValues.blog_id = encrypt(`${ele.dataValues.blog_id}`);
        return { ...ele.dataValues, author: user.userName };
      })
    );
    loading = false;
    console.log("isAdmin ", req.session.admin);
    res.render("home", {
      isAuthenticate,
      blogList: BlogDetails,
      loading: loading,
      categories: categories,
      currentPage: page,
      totalPages: totalPages,
      admin: req.session?.admin || false,
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
    const result = blog.userId === user?.user_id || user.isAdmin;
    return result;
  } catch (error) {
    console.error("Error checking blog authorization:", error);
    return false;
  }
}

async function getAuditLogs(req, res) {
  const data = await AuditLog.findAll();

  res.render("auditLogs", { data });
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
