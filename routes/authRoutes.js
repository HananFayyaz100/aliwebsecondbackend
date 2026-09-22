const express = require("express");

const {
    registerAdmin,
    loginAdmin,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const router = express.Router();


/*
========================================
LOGIN
========================================
*/

/*
========================================
REGISTER ADMIN
========================================
*/

router.post(
  "/register",
  registerAdmin
);


router.post(
  "/login",
  loginAdmin
);


/*
========================================
FORGOT PASSWORD
========================================
*/

router.post(
  "/forgot-password",
  forgotPassword
);


/*
========================================
RESET PASSWORD
========================================
*/

router.post(
  "/reset-password/:token",
  resetPassword
);


module.exports = router;