const express = require("express");
const router = express.Router();

//  Require controller modules
const userController = require("../controllers/userController");

router.post("/sign-up", userController.userSignUp);
router.post("/log-in", userController.userLogIn);

module.exports = router;
