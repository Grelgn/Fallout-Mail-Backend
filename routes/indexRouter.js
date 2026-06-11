const express = require("express");
const router = express.Router();

//  Require controller modules
const userController = require("../controllers/userController");
const messageController = require("../controllers/messageController");

function isAuthenticated(req, res, next) {
	if (req.isAuthenticated()) return next();
	return res.status(401).json({ success: false, message: "Not logged in" });
}

router.post("/sign-up", userController.userSignUp);
router.post("/log-in", userController.userLogIn);
router.post("/log-out", userController.userLogOut);
router.get("/messages", isAuthenticated, messageController.getMessages);
router.post("/message", isAuthenticated, messageController.sendMessage);

module.exports = router;
