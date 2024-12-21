const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const prisma = require("../prismaClient");

const sendMessage = [
	body("receiver")
		.trim()
		.notEmpty()
		.escape()
		.withMessage("Receiver must be specified.")
		.isLength({ max: 25 })
		.withMessage("Receiver name can't be more than 25 characters."),
	body("title")
		.trim()
		.notEmpty()
		.escape()
		.withMessage("Title must be specified.")
		.isLength({ max: 25 })
		.withMessage("Title can't be more than 25 characters."),
	body("body")
		.trim()
		.notEmpty()
		.escape()
		.withMessage("Message must be specified.")
		.isLength({ max: 25 })
		.withMessage("Message can't be more than 25 characters."),

	asyncHandler(async (req, res, next) => {
		const result = validationResult(req);
		if (result.errors.length > 0) {
			return res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: result.errors,
			});
		} else {
			const receiver = await prisma.user.findFirst({
				where: {
					username: req.body.receiver,
				},
				select: {
					id: true,
				},
			});
			const message = await prisma.message.create({
				data: {
					senderId: req.body.sender,
					receiverId: receiver.id,
					title: req.body.title,
					body: req.body.body,
				},
			});
			return res.status(201).json({
				success: true,
				message: "Message sent",
				data: message,
			});
		}
	}),
];

module.exports = {
	sendMessage,
};
