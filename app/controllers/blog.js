const Blog = require("../models/blog");
const Category = require("../models/category");
const User = require("../models/user");
const Sequelize = require("sequelize");
const { Op } = require("sequelize");

const AuditLog = require("../models/auditLogs");
const fs = require("fs");
const path = require("path");
const Tag = require("../models/tags");
const { getComments } = require("./comment");
const { decrypt, encrypt } = require("./helper");

async function updateBlog(req, res) {
  try {
    const { title, summary, category, description, tags } = req.body;
    const userId = req.session.user.user_id;
    const userEmail = req.session.user.email;
    const decryptedId = decrypt(req.body?.blogId);
    const blogData = await Blog.findOne({
      where: {
        blog_id: decryptedId,
      },
    });

    if (req.file?.filename && blogData?.dataValues?.image !== "noImage.jpg") {
      const imageName = blogData.dataValues.image;
      const uploadDir = path.join(__dirname, "..", "..", "uploads");
      const imagePath = path.join(uploadDir, imageName);
      fs.unlink(imagePath, (err) => {
        console.log("path/file.txt was deleted");
      });
    }
    // const updatedImage = req.file?.filename || blogData?.dataValues?.image;
    // let categoryId = await Category.findOne({ where: { name: category } });
    // let tagArray = tags.split(",").map((item) => item.trim());
    // const tagIds = [];

    // for (const tagName of tagArray) {
    //   let tag = await Tag.findOne({ where: { tagname: tagName } });
    //   if (!tag) {
    //     tag = await Tag.create({ tagname: tagName });
    //   }
    //   tagIds.push(tag.tag_id);
    // }
    // if (!categoryId) {
    //   categoryId = await Category.create({
    //     name: category,
    //   });
    // }
    // blogData.set({
    //   blogTitle: title,
    //   summary: summary,
    //   categoryId: categoryId.category_id,
    //   userId: userId,
    //   image: image,
    //   description,
    //   tags: tagIds,
    // });
    // await blogData.save();
    // await updateAuditLogs(userEmail, blogData.blog_id, "Update");
    req.flash("success", "Blog Updated Successfully");
    return res.json({
      redirectUrl: "/home",
    });
  } catch (error) {
    console.log("update blog error", error);
    req.flash("error", "Somethig went wrong!! unable to update blog");
    return res.json({
      redirectUrl: "/blog/update",
    });
  }
}

async function createBlog(req, res) {
  try {
    const { title, summary, category, description, tags } = req.body;
    const userId = req.session.user.user_id;
    const userEmail = req.session.user.email;
    const image = req.file?.filename || "noImage.jpg";
    let categoryId = await Category.findOne({ where: { name: category } });
    let tagArray = tags.split(",").map((item) => item.trim());
    const tagIds = [];

    for (const tagName of tagArray) {
      let tag = await Tag.findOne({ where: { tagname: tagName } });
      if (!tag) {
        tag = await Tag.create({ tagname: tagName });
      }
      tagIds.push(tag.tag_id);
    }
    if (!categoryId) {
      categoryId = await Category.create({
        name: category,
      });
    }
    const newFile = await Blog.create({
      blogTitle: title,
      summary: summary,
      categoryId: categoryId.category_id,
      userId: userId,
      image: image,
      description,
      tags: tagIds,
    });
    await updateAuditLogs(userEmail, newFile.blog_id, "Create");

    req.flash("success", "Blog Created Successfully");
    return res.json({
      redirectUrl: "/home",
    });
  } catch (error) {
    console.log("create blog error", error);
    req.flash("error", "Somethig went wrong!! unable to create blog");
    return res.json({
      redirectUrl: "/blog/create",
    });
  }
}

async function blogDetails(id, user) {
  const decryptedId = decrypt(id);
  try {
    const blogPromise = await Blog.findOne({
      where: { blog_id: decryptedId },
    });
    const userPromise = await User.findOne();
    const [data, user] = await Promise.all([blogPromise, userPromise]);

    const BlogDetails = async () => {
      let user = await User.findOne({ where: { user_id: data.userId } });
      const allComments = await getComments(decryptedId, user);
      data.dataValues.blog_id = encrypt(`${data.dataValues.blog_id}`);
      return {
        ...data.dataValues,
        comments: allComments,
        author: user.userName,
      };
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
    const post = await Blog.findByPk(blogId);

    if (!post) {
      return res.status(404).json({ error: "Blog not found" });
    }
    const imageName = post.image;
    if (imageName !== "noImage.jpg") {
      const uploadDir = path.join(__dirname, "..", "..", "uploads");
      const imagePath = path.join(uploadDir, imageName);
      fs.unlink(imagePath, (err) => {
        console.log("path/file.txt was deleted");
      });
    }
    const auditRes = await updateAuditLogs(userEmail, post.blog_id, "Delete");

    await post.destroy();
    req.flash("success", "Blog Updated Successfully");
    res.redirect("/home");
  } catch (error) {
    console.error("Error deleting blog:", error);
    req.flash("error", "Error deleting blog");
    res.status(400).json({
      redirectUrl: "/home",
    });
  }
}

async function fetchBlogData(filterQuery, page = 1, limit = 8) {
  const offset = (page - 1) * limit;
  const whereCondition = {};

  if (filterQuery) {
    const categoryId = await Category.findOne({
      where: { name: filterQuery },
      attributes: ["category_id"],
    });
    const tagId = await Tag.findOne({
      where: { tagname: filterQuery },
      attributes: ["tag_id"],
    });
    whereCondition[Op.or] = [
      { categoryId: categoryId?.category_id || "" },
      { blogTitle: { [Op.like]: `%${filterQuery}%` } },
      { tags: { [Op.like]: `%${tagId?.tag_id}%` } },
    ];
  }

  const allBlogs = await Blog.findAll({
    where: whereCondition,
    limit: limit,
    offset: offset,
    include: [Category],
    // include: [User, Tag], //not working
  });
  const BlogDetails = await Promise.all(
    allBlogs.map(async (ele) => {
      const user = await User.findOne({ where: { user_id: ele.userId } }); //checkpoint
      const tags = await Tag.findAll({
        where: { tag_id: ele.tags },
        attributes: ["tagname"],
      });
      const tagNames = tags.map((tag) => tag.tagname);
      return {
        blog_id: encrypt(`${ele.blog_id}`),
        blogTitle: ele.blogTitle,
        summary: ele.summary,
        description: ele.description,
        image: ele.image,
        category: ele.category.name,
        author: user.userName,
        tags: tagNames,
        likes: ele.likes,
        views: ele.views,
      };
    })
  );
  return BlogDetails;
}

async function fetchCategoryData() {
  const categories = await Category.findAll({
    attributes: ["name"],
  });
  const categoryNames = categories.map((category) => category.name);
  return categoryNames;
}

async function totalBlogs(filterQuery) {
  const categoryId = await Category.findOne({
    where: { name: filterQuery || "" },
    attributes: ["category_id"],
  });
  const whereCondition = filterQuery
    ? {
        [Op.or]: [
          { categoryId: categoryId?.dataValues?.category_id || "" },
          { blogTitle: { [Op.like]: `%${filterQuery}%` } },
        ],
      }
    : {};

  return await Blog.count({
    where: whereCondition,
  });
}
async function getBlogs(req, res) {
  try {
    let isAuthenticate = req.session.isAuthenticate;
    let loading = true;
    let filterQuery = req.query?.filter;
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    if (filterQuery === "All") filterQuery = "";
    // Get Blog Data
    const BlogDetails = await fetchBlogData(filterQuery, page, limit);
    // get category List
    const allCategory = await fetchCategoryData();

    // get blog count
    const blogCount = await totalBlogs(filterQuery);
    const totalPages = Math.ceil(blogCount / limit);

    loading = false;
    const successMessage = req.flash("success");
    const errorMessage = req.flash("error");
    res.render("home", {
      isAuthenticate,
      blogList: BlogDetails,
      loading: loading,
      categories: allCategory,
      currentPage: page,
      totalPages: totalPages,
      admin: req.session?.admin || false,
      successMessage,
      errorMessage,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function checkAuthBlog(user, id) {
  try {
    const decryptId = decrypt(id);
    const blog = await Blog.findOne({
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
  if (req.session?.admin) {
    const data = await AuditLog.findAll();
    const admin = req.session?.admin || false;
    const isAuthenticate = req.session?.isAuthenticate || false;
    res.render("auditLogs", { categories: [], data, admin, isAuthenticate });
  } else {
    req.flash("error", "Access denied");
    res.redirect("/home");
  }
}
async function getBlogDetails(req, res) {
  const categoryPromise = await Category.findAll();
  const tagList = await Tag.findAll();
  let id;
  if (req.query.id) id = decrypt(req.query.id);
  let blogContent = null;
  let result = id ? await Blog.findOne({ where: { blog_id: id } }) : undefined;
  if (!result) {
    req.flash("error", "Access denied");
    return res.redirect("/home");
  }
  blogContent = { ...result };
  blogContent.dataValues.blog_id = encrypt(`${id}`);
  res.render("updateBlog", {
    categories: categoryPromise,
    blogContent,
    tags: tagList,
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
  updateBlog,
};
