const express = require("express");
const router = express.Router();

//  Require controller modules
const userController = require("../controllers/userController");
const messageController = require("../controllers/messageController");

router.post("/sign-up", userController.userSignUp);
router.post("/log-in", userController.userLogIn);
router.post("/message", messageController.sendMessage);

module.exports = router;
