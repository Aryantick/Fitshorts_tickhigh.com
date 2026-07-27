const router = require('express').Router();
const authenticateUser = require('./middlewares/auth.middlewares');
const usersController = require('./users.controller');

router.get('/me', authenticateUser, usersController.getMe);

module.exports = router;