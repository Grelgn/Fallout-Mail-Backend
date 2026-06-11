const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const prisma = require("../prismaClient");

const sendMessage = [
	body("receiver")
		.trim()
		.notEmpty()
		.withMessage("Receiver must be specified")
		.isLength({ max: 25 })
		.withMessage("Receiver name can't be more than 25 characters")
		.escape(),
	body("title")
		.trim()
		.notEmpty()
		.withMessage("Title must be specified")
		.isLength({ max: 50 })
		.withMessage("Title can't be more than 50 characters")
		.escape(),
	body("body")
		.trim()
		.notEmpty()
		.withMessage("Message must be specified")
		.isLength({ max: 400 })
		.withMessage("Message can't be more than 400 characters")
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
		const receiver = await prisma.user.findUnique({
			where: {
				username: req.body.receiver,
			},
			select: {
				id: true,
			},
		});
		if (!receiver) {
			return res.status(400).json({
				success: false,
				message: "User does not exist",
			});
		}
		const message = await prisma.message.create({
			data: {
				senderId: req.user.id,
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
	}),
];

const getMessages = asyncHandler(async (req, res) => {
	const user = await prisma.user.findUnique({
		where: {
			id: req.user.id,
		},
		select: {
			messagesReceived: {
				include: {
					sender: {
						select: {
							username: true,
						},
					},
				},
			},
			messagesSent: {
				include: {
					receiver: {
						select: {
							username: true,
						},
					},
				},
			},
		},
	});
	if (!user) {
		return res.status(401).json({ success: false, message: "Not logged in" });
	}
	return res.status(200).json({
		success: true,
		messagesReceived: user.messagesReceived,
		messagesSent: user.messagesSent,
	});
});

module.exports = {
	sendMessage,
	getMessages,
};
