require("dotenv").config( );
const express = require("express");
const app = express();
const socketio = require("socket.io");
const mongoose = require("mongoose");
// const DB = require("./config/keys").mongoUrl;
const cors = require("cors");
const users = require("./controller/api/users").router;
const nodemailer = require("nodemailer");
const passport = require("passport");
require("./config/passport");
const Email = process.env.email /* require("./config/keys").email; */
const emailPassword = process.env.emailPassword // require("./config/keys").emailPassword;
let http = require("http").Server(app);
const io = socketio(http);
require("events").EventEmitter.defaultMaxListeners = 115;
// const EventEmitter = require("events");
// const emitter = new EventEmitter();
// let DB = `mongodb+srv://learn:${process.env.mongoDbPassword}@learning-lpcqr.mongodb.net/${process.env.mongodbName}?retryWrites=true&w=majority`;
const session = require("express-session");



// const EventEmitter = require("eventemitter3");
// const emitter = new EventEmitter();
//  emitter.setMaxListeners(50);
const PORT = process.env.PORT || 3001;


const connectMongoDB = async () => {
	try {
		await mongoose.connect(
			process.env.MONGO_DB,
			{ useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true },
			(_, db) => {
				console.log("DATABASE CONNECTED");
				return db;
			}
		);
	} catch (error) {
		console.log("propblem to connect to db");
	}
};
connectMongoDB();

const server = http.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

// const io = socketio(server);

io.on("connection", (socket) => {
	require("./controller/api/users").socket(io);
	return io;
});

//include io in req
// app.use((req, res, next) => {
// 	req.io = io;
// 	// req.connectedUsers = connectedUsers;
// 	return next();
// });

app.use(express.json());
// app.use(
// 	session({
// 		secret: "shuut it's secret",
// 		// resave: false,
// 		// saveUninitialized: false,
// 		cookie: {
// 			// secure: true,
// 			// httpOnly: true,
// 			// sameSite: true,
// 		},
// 	})
// );

// allow cors for all
app.use(cors({credentials: true}));
//controller for user
app.use("/api/users", users);

app.use(passport.initialize());

module.exports = {
	io: io,
	app: app,
	// db: db
};
