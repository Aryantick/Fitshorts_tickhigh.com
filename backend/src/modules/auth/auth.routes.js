const router = require('express').Router();
const authController = require('./auth.controller');
const authlogout = require("./auth.controller")
const authenticateUser = require('../../middlewares/auth.middlewares');

router.post('/auth/refresh', authController.refreshToken);
router.post('/auth/logout', authenticateUser, authlogout.logoutUser);

module.exports = router;