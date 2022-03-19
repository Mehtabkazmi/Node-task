const User = require('../models/User');
const Post = require('../models/Post');
const { sendEmail } = require('../middlewares/sendEmail');
const crypto = require('crypto');
const cloudinary = require('cloudinary');
const { post } = require('../routes/post');

exports.register = async (req, res) => {
    try {
        const { name, email, password, avatar } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                success: false, message: "user already exist"
            });
        }

        const mycloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatarss",
        });

        user = await User.create({
            name,
            email,
            password,
            avatar: { public_id: mycloud.public_id, url: mycloud.secure_url },
        });

        const token = await user.generateToken();

        const options = {
            expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            httpOnly: true,
        };

        res.status(201).cookie("token", token, options).json({
            success: true,
            user,
            token,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

//login
exports.signin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email })
            .select('+password').populate("posts followers following");
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "user not exist",
            });
        }
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "wrong password",
            });
        }

        const token = await user.generateToken();

        const options = {
            expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            httpOnly: true,
        };

        res.status(201).cookie("token", token, options).json({
            success: true,
            user,
            token,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

//logout
exports.logout = async (req, res) => {
    try {
        res.status(200)
            .cookie("token", null, { expires: new Date(Date.now()), httpOnly: true })
            .json({
                success: true,
                message: "logged out",
            });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
// Follow user
exports.followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const loggedInUser = await User.findById(req.user._id);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (loggedInUser.following.includes(userToFollow._id)) {
      const indexfollowing = loggedInUser.following.indexOf(userToFollow._id);
      const indexfollowers = userToFollow.followers.indexOf(loggedInUser._id);

      loggedInUser.following.splice(indexfollowing, 1);
      userToFollow.followers.splice(indexfollowers, 1);

      await loggedInUser.save();
      await userToFollow.save();

      res.status(200).json({
        success: true,
        message: "User Unfollowed",
      });
    } else {
      loggedInUser.following.push(userToFollow._id);
      userToFollow.followers.push(loggedInUser._id);

      await loggedInUser.save();
      await userToFollow.save();

      res.status(200).json({
        success: true,
        message: "User followed",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// update password
exports.updatePassword = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("+password");
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "please provide old and new password",
            });
        }
        const isMatch = await user.matchPassword(oldPassword);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "incorrect password",
            });
        }

        user.password = newPassword;
        await user.save();
        res.status(200).json({
            success: true,
            message: "changed password",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
// update profile

exports.updateProfile = async (req, res) => {
    try {
        
        const user = await User.findById(req.user._id);
        
        const { name, email, avatar } = req.body;

        if (name) { user.name = name }
        if (email) { user.email = email }
        if (avatar) {
            await cloudinary.v2.uploader.destroy(user.avatar.public_id);
        
            const mycloud = await cloudinary.v2.uploader.upload(avatar, {
                folder: "avatars",
            });
            user.avatar.public_id = mycloud.public_id;
            user.avatar.secure_url = mycloud.secure_url;
        }
    
        await user.save();
    
        res.status(200).json({
            success: true,
            message: "profile updated",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// delete my profile

exports.deleteProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        const posts = user.posts;
        const followers = user.followers;
        const followings = user.followings;
        const userId = user._id;

        await avatar.v2.uploader.destroy(user.avatar.public_id);

        await user.remove();

        // Logout user after deleting profile 
        res.cookie("token", null, {
            expires: new Date(Date.now()),
            httpOnly: true,
        });

        // Delete all posts of the user
        for (let i = 0; i < posts.length; i++) {
            const post = await Post.findById(posts[i]);
            await cloudinary.v2.uploader.destroy(user.avatar.public_id);
            await post.remove();
        }

        // Removing User from Followers Following
        for (let i = 0; i < followers.length; i++) {
            const follower = await User.findById(followers[i]);

            const index = follower.followings.indexOf(userId);
            follower.followings.splice(index, 1);
            await follower.save();
        }
        // Removing User from Followings Followers
        for (let i = 0; i < followings.length; i++) {
            const following = await User.findById(followings[i]);

            const index = following.followers.indexOf(userId);
            following.followers.splice(index, 1);
            await following.save();
        }

        // removing all comments of the user from all posts
        const allPosts = await Post.find();

        for (let i = 0; i < allPosts.length; i++) {
            const post = await Post.findById(allPosts[i]._id);

            for (let j = 0; j < post.comments.length; j++) {
                if (post.comments[j].user === userId) {
                    post.comments.splice(j, 1);
                }
            }
            await post.save();
        }

        // removing all likes of the user from all posts
        for (let i = 0; i < allPosts.length; i++) {
            const post = await Post.findById(allPosts[i]._id);

            for (let j = 0; j < post.likes.length; j++) {
                if (post.likes[j] === userId) {
                    post.likes.splice(j, 1);
                }
            }
            await post.save();
        }
        res.status(200).json({
            success: true,
            message: "Profile Deleted",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
// my profile
exports.myProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "posts followers following"
    );

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "posts followers following"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      name: { $regex: req.query.name, $options: "i" },
    });

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.forgetPassword = async (req, res) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "user not found",
        });
    }

    const resetPwdToken = user.getResetPasswordToken();
    await user.save();

    const resetUrl = `${req.protocol}://${req.get("host")}/password/reset/${resetPwdToken}`;
    const message = `Reset Your Password by clicking on the link below: \n\n ${resetUrl}`;

    try {
        await sendEmail({
            email: user.email,
            subject: "reset password",
            message,
        });

        res.status(201).json({
            success: true,
            message: `email sent to ${user.email}`,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// reset password
exports.resetPassword = async (req, res) => {
    try {
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Token is invalid or has expired",
            });
        }
        
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: "forgot password",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// get my posts
exports.getMyPosts = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        const posts = [];
        for (let i = 0; i < user.posts.length; i++) {
            const post = await Post.findById(user.posts[i]).populate(
                "likes and comments.user owner"
            );
            posts.push(post);
        }
        res.status(200).json({
            success: true,
            posts,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// get User Posts
exports.getUserPosts = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        const posts = [];
        for (let i = 0; i < user.posts.length; i++) {
            const post = await Post.findById(user.posts[i]).populate(
                "likes comments",
            );
            posts.push(post);
        }
        res.status(200).json({
            success: true,
            posts,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};