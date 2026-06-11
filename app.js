const express = require("express");
const path = require("path");
const indexRouter = require("./routes/indexRouter");
require("dotenv").config();
const cors = require("cors");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const prisma = require("./prismaClient");

const app = express();

app.set("trust proxy", 1);

app.use(
	cors({
		origin: [
			"https://fallout-mail.31.97.179.20.sslip.io",
			"http://localhost:5173",
			"http://localhost:5174",
		],
		credentials: true,
	})
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
	session({
		cookie: {
			maxAge: 7 * 24 * 60 * 60 * 1000, // ms
			sameSite: "none",
			secure: true,
		},
		secret: process.env.SECRET,
		resave: false,
		saveUninitialized: false,
		store: new PrismaSessionStore(prisma, {
			checkPeriod: 2 * 60 * 1000, //ms
			dbRecordIdIsSessionId: true,
			dbRecordIdFunction: undefined,
		}),
	})
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
	new LocalStrategy(async (username, password, done) => {
		try {
			const user = await prisma.user.findFirst({
				where: {
					username: username,
				},
				include: {
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
				return done(null, false, { message: "Incorrect username" });
			}

			const match = await bcrypt.compare(password, user.password);
			if (!match) {
				return done(null, false, { message: "Incorrect password" });
			}

			return done(null, user);
		} catch (err) {
			return done(err);
		}
	})
);

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
	try {
		const user = await prisma.user.findFirst({
			where: {
				id: id,
			},
		});

		done(null, user);
	} catch (err) {
		done(err);
	}
});

app.use(express.static(path.join(__dirname, "public")));
app.use("/", indexRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
	console.log(`My first Express app - listening on port ${PORT}!`)
);

