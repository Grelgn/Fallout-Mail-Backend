const express = require("express");
const path = require("path");
const indexRouter = require("./routes/indexRouter");
require("dotenv").config();
const bodyParser = require("body-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const prisma = require("./prismaClient");

const app = express();

app.use(express.urlencoded({ extended: false }));

passport.use(
	new LocalStrategy(async (username, password, done) => {
		try {
			const user = await prisma.user.findFirst({
				where: {
					username: username,
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

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "public")));
app.use("/", indexRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
	console.log(`My first Express app - listening on port ${PORT}!`)
);

module.exports = {
	prisma,
};
