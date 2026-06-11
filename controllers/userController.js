const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const passport = require("passport");
const prisma = require("../prismaClient");
const { Prisma } = require("@prisma/client");

const userSignUp = [
	body("username")
		.trim()
		.notEmpty()
		.withMessage("Username must be specified")
		.isLength({ max: 25 })
		.withMessage("Username can't be more than 25 characters")
		.escape(),
	body("password")
		.trim()
		.notEmpty()
		.withMessage("Password must be specified")
		.isLength({ min: 8 })
		.withMessage("Password must be at least 8 characters")
		.isLength({ max: 25 })
		.withMessage("Password can't be more than 25 characters"),
	body("confirm")
		.trim()
		.custom((value, { req }) => {
			return value === req.body.password;
		})
		.withMessage("Passwords do not match")
		.escape(),

	asyncHandler(async (req, res, next) => {
		const result = validationResult(req);
		if (!result.isEmpty()) {
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: result.array(),
			});
		}
		try {
			const hashedPassword = await bcrypt.hash(req.body.password, 10);
			const user = await prisma.user.create({
				data: {
					username: req.body.username,
					password: hashedPassword,
				},
			});
			return res.status(201).json({
				success: true,
				message: "User created successfully",
				userId: user.id,
			});
		} catch (e) {
			if (
				e instanceof Prisma.PrismaClientKnownRequestError &&
				e.code === "P2002"
			) {
				return res.status(400).json({
					success: false,
					message: "User already exists",
				});
			}
			return res.status(500).json({
				success: false,
				message: "Error creating user",
			});
		}
	}),
];

const userLogIn = (req, res, next) => {
	passport.authenticate("local", (err, user, info) => {
		if (err) {
			return res.status(500).json({
				success: false,
				message: "An error occurred during authentication",
				error: err,
			});
		}
		if (!user) {
			return res.status(401).json({
				success: false,
				message: info?.message || "Invalid credentials",
			});
		}
		req.logIn(user, async (err) => {
			if (err) {
				return res.status(500).json({
					success: false,
					message: "Error logging in",
					error: err,
				});
			}
			// Get list of users
			const userList = await prisma.user.findMany({
				select: {
					id: true,
					username: true,
					signUpDate: true,
				},
			});

			// Excluding the password
			const { password, ...userData } = user;
			return res.status(200).json({
				success: true,
				message: "Login successful",
				user: userData,
				userList: userList,
			});
		});
	})(req, res, next);
};

const userLogOut = (req, res, next) => {
	req.logout((err) => {
		if (err) {
			return res
				.status(500)
				.json({ success: false, message: "Error logging out" });
		}
		req.session.destroy((err) => {
			if (err) {
				return res
					.status(500)
					.json({ success: false, message: "Error logging out" });
			}
			res.clearCookie("connect.sid", { sameSite: "none", secure: true });
			return res.status(200).json({ success: true, message: "Logged out" });
		});
	});
};

module.exports = {
	userSignUp,
	userLogIn,
	userLogOut,
};
