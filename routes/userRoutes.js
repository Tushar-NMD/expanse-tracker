const express = require('express');
const { registerUser, loginUser } = require('../controllers/userController');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validationMiddleware');

const router = express.Router();

// POST /api/users/register
router.post('/register', validateUserRegistration, registerUser);

// POST /api/users/login
router.post('/login', validateUserLogin, loginUser);

module.exports = router;