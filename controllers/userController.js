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
			res.json({
				message: `Invalid`,
				errors: result.errors,
			});
		} else {
			bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
				if (err) {
					return;
				} else {
					try {
						const user = await prisma.user.create({
							data: {
								username: req.body.username,
								password: hashedPassword,
							},
						});
						res.json({
							message: `User created`,
							id: `${user.id}`,
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

const userLogIn = [
	passport.authenticate("local", {
		successMessage: `Login Successful`,
		failureMessage: `Login Failed`,
	}),
];

module.exports = {
	userSignUp,
	userLogIn,
};
