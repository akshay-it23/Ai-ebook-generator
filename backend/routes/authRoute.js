//login detials enter krn k
const express = require('express');
const {
    registerUser,
    loginUser,
    getProfile,
    updateUserProfile
} = require('../controller/authController');

const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();   // ✔ Correct spelling
//here no auhtentication need in this 

router.post('/register', registerUser);
router.post('/login', loginUser);
//protect is used for authentication
router.get('/profile', protect, getProfile); // ✔ Correct name
router.put('/profile', protect, updateUserProfile);

module.exports = router;

