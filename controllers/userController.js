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
		.escape()
		.withMessage("Username must be specified.")
		.isLength({ max: 25 })
		.withMessage("Username can't be more than 25 characters."),
	body("password")
		.trim()
		.notEmpty()
		.escape()
		.withMessage("Password must be specified.")
		.isLength({ max: 25 })
		.withMessage("Password can't be more than 25 characters."),
	body("confirm")
		.trim()
		.custom((value, { req }) => {
			return value === req.body.password;
		})
		.escape()
		.withMessage("Passwords do not match."),

	asyncHandler(async (req, res, next) => {
		const result = validationResult(req);
		if (result.errors.length > 0) {
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: result.errors,
			});
		} else {
			bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
				if (err) {
					return res.status(500).json({
						success: false,
						message: "Error creating user",
					});
				} else {
					try {
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
						if (e instanceof Prisma.PrismaClientKnownRequestError) {
							if (e.code === "P2002") {
								res.json({
									message: `Username already exists`,
								});
							}
						}
					}
				}
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
		req.logIn(user, (err) => {
			if (err) {
				return res.status(500).json({
					success: false,
					message: "Error logging in",
					error: err,
				});
			}
			return res.status(200).json({
				success: true,
				message: "Login successful",
				user: {
					id: user.id,
					username: user.username,
				},
			});
		});
	})(req, res, next);
};

module.exports = {
	userSignUp,
	userLogIn,
};
