const express = require('express');
const { createPost } = require('../controllers/post');
const { isAuth } = require('../middlewares/auth');

const router = express.Router();

router.route('/post/upload').post(isAuth,createPost);

module.exports=router