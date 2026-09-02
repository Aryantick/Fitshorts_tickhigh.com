const router = require('express').Router();
const authController = require('./auth.controller');
const authenticateUser = require('../../middlewares/auth.middlewares');

router.post('/auth/refresh', authController.refreshToken);
router.post('/auth/logout', authenticateUser, authController.logoutUser);
router.post('/auth/dialog/verify-sync', authController.verifyDialogSync);

module.exports = router;