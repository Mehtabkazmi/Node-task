const Post = require('../models/Post');
const User = require('../models/User');
const cloudinary=require('cloudinary');
exports.createPost = async (req, res) => {
    try {
        const mycloud = await cloudinary.v2.uploader.upload(req.body.image, {
            folder: "posts",
        });
        newPostData = {
            caption: req.body.caption,
            image: {
                public_id: mycloud.public_id,
                url: mycloud.secure_url,
            },
            owner: req.user._id,
        };

        const post = await Post.create(newPostData);
        const user = await User.findById(req.user._id);
        // const [post, user] = await Promise.all([
        //     Post.create(newPostData), User.findById(req.user._id)
        // ]);

        user.posts.unshift(post._id);

        await user.save();
        res.status(201).json({
            success: true,
            message: "Posted",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
};

//delete posts
exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "post not found",
            });
        }
        if (post.owner.toString() !== post.user._id.toString()) {
            return res.status(401).json({
                success: false,
                message: "post not found",
            });
        }

        await cloudinary.v2.uploader.destroy(post.image.public_id);
        await post.remove();

        const user = await User.findById(req.user._id);

        const index = user.posts.indexOf(req.params.id);
        user.posts.splice(index, 1);

        await user.save();

        res.status(200).json({
            success: true,
            message: "post deleted",
        });
       
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.likeAndUnlikePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "post not found",
            });
        }
        if (post.likes.includes(req.user._id)) {
            const index = post.likes.indexOf(req.params.id);
            post.likes.splice(index, 1);

            await post.save();

            return res.status(200).json({
                success: true,
                message: "unliked",
            });
        } else {
            post.likes.push(req.user._id);

            await post.save();

            return res.status(200).json({
                success: true,
                message: "liked",
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
// get post of following
exports.getPostOfFollowing = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "user not found",
            });
        }
        const posts = await Post.find({
            owner: {
                $in: user.following,
            },
        }).populate("owner likes comments.user");

        res.status(200).json({
            success: true,
            posts: posts.reverse(),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// update caption
exports.updateCaption = async (req, res) => {
    try {
    const post = await Post.findById(req.params.id);

    if (!post) {
        return res.status(404).json({
            success: false,
            message: "post not found",
        });
    }
    if (post.owner.toString() !== post.user._id.toString()) {
        return res.status(401).json({
            success: false,
            message: "unauthorized",
        });
    }
    post.caption = req.body.caption;
    await post.save();
    res.status(200).json({
        success: true,
        message: "post updated",
    });    
    } catch (error) {
       res.status(500).json({
        success: false,
        message: error.message,
    });  
    }
};

exports.commentOnPost = async (req, res) => {
    try {
        const post = await Post.findById(req, params.id);
        if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
        }
        let commentIndex = -1;

        post.comments.forEach((item, index) => {
            if (item.user.toString() === req.user._id) {
                commentIndex = index;
            }
        });

        

    } catch (error) {
        
    }
}