const Blog = require("../models/blog");
const Comment = require("../models/comments");
const { decrypt, encrypt } = require("./helper");

const Filter = require("bad-words");
var profanity = require("profanity-hindi");
const filter = new Filter();

async function getComments(blogId, user) {
  const currUserId = user?.user_id;
  const blogUserId = await Blog.findOne({
    where: { blog_id: blogId },
    attributes: ["userId"],
  });
  let whereCondition = {
    approve: undefined,
  };
  if (currUserId === blogUserId?.userId) {
    whereCondition = {
      blogId: blogId,
    };
  }
  const data = await Comment.findAll({
    where: whereCondition,
  });
  return data;
}

async function addComment(req, res) {
  const { username, comment } = req.body;

  if (filter.isProfane(comment) || profanity.isMessageDirty(comment)) {
    console.log("bad word detected");
    req.flash("error", "Text contains bad words");
    return res.redirect(`/blog/?id=${req.query.id}`);
  }

  const blogId = decrypt(req.query.id);
  let checkuser = false;
  const blogAuthor = await Blog.findOne({
    where: {
      blog_id: blogId,
    },
    attributes: ["userId"],
  });
  if (blogAuthor?.userId === req.session?.user?.user_id) {
    checkuser = true;
  }
  await Comment.create({
    username: username,
    blogId: blogId,
    description: comment,
    approve: checkuser,
  });
  return res.redirect(`/blog/?id=${req.query.id}`);
}

async function changeApproveStatus(req, res) {
  const comment = await Comment.findOne({
    where: {
      comment_id: req.query.id,
    },
  });
  comment.set({
    approve: !comment?.approve,
  });
  await comment.save();
  const blogId = encrypt(`${comment?.blogId}`);
  res.redirect(`/blog/?id=${blogId}`);
}

async function deleteComment(req, res) {
  const comment = await Comment.findOne({
    where: {
      comment_id: req.query.id,
    },
  });
  const blogId = encrypt(`${comment?.blogId}`);

  await comment.destroy();
  res.redirect(`/blog/?id=${blogId}`);
}

module.exports = {
  getComments,
  addComment,
  changeApproveStatus,
  deleteComment,
};
