const User = require("../models/User");
const jwt = require("jsonwebtoken");

exports.isAuth = async (req, res, next) => {
    try {
        const {token} = req.cookies;

        if (!token) {
            return req.status(401).json({
                message: "please login first",
            });
        }
        const decode = await jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decode._id);

        next();
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};