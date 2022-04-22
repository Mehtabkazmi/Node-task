const express = require("express");
const {
  createPost,
  likeAndUnlikePost,
  commentOnPost,
  deleteComment,
  updateComment,
} = require("../controllers/post");
const { isAuthenticated } = require("../middlewares/auth");

const router = express.Router();

router.route("/post/upload").post(isAuthenticated, createPost);

router.route("/post/:id").get(isAuthenticated, likeAndUnlikePost);
router.route("/post/comment/:id").put(isAuthenticated, commentOnPost).delete(isAuthenticated, deleteComment);
router.route("/post/comment/update/:id").put(isAuthenticated,updateComment);
module.exports = router;
