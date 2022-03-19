const express = require('express');
const {
    register,
    signin,
    logout,
    updatePassword,
    updateProfile,
    deleteProfile,
    myProfile,
    getUserProfile,
    getAllUsers,
} = require('../controllers/user');
const { isAuth } = require('../middlewares/auth');

const router = express.Router();

router.route('/register').post(register);
router.route('/login').post(signin);
router.route('/logout').get(logout);
router.route('/update/password').put(isAuth,updatePassword);
router.route('/update/profile').put(isAuth,updateProfile);
router.route('/delete/me').delete(isAuth,deleteProfile);
router.route('/me').get(isAuth,myProfile);
router.route('/getUserProfile').get(isAuth,getUserProfile);
router.route('/getUsers').get(isAuth,getAllUsers);

module.exports=router