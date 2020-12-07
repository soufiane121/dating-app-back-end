require("dotenv").config();

const mongoose = require("mongoose");
const MongoClient = require("mongodb").MongoClient;
// const DB = require("../../config/keys").mongoUrl;
let DB = `mongodb+srv://learn:${process.env.mongoDbPassword}@learning-lpcqr.mongodb.net/${process.env.mongodbName}?retryWrites=true&w=majority`;
const User = require("../../models/User");
const Message = require("../../models/Message");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mySecretKey = process.env.MY_SECRET_KEY //|| require("../../config/keys").mySecretKey;
const adminKey = process.env.adminKey; // require("../../config/keys").adminKey;
const passport = require("passport");
require("../../config/passport")(passport);
const validateRegisterInput = require("../../validation/signup");
const validateLoginInput = require("../../validation/login");
const nodemailer = require("nodemailer");
const Email = process.env.email; // require("../../config/keys").email;
const emailPassword = process.env.emailPassword; // require("../../config/keys").emailPassword;
const socketio = require("socket.io");
const _ = require("underscore");

const client = new MongoClient(DB, { useUnifiedTopology: true });
// let io;
// mongoose.set("useCreateIndex", true);

// const upload = require("../../midlleware/uploadImage")
const {
	upload,
	deletImage,
	removeImages,
	removeMultipleImages,
} = require("../../midlleware/uploadImage");

//===============Email verification setting=============================

const smtpTransport = nodemailer.createTransport({
	service: "Gmail",
	auth: {
		user: Email,
		pass: emailPassword,
	},
});

let rand, mailOptions, host, link;

const htmlTemlplate = (rand) => {
	return `Hello,<br> Please Enter the code below to verify your email.<br>  
	<h4 style={color: "red"}>${rand}</h4><br>
	This code expires in 10 minutes
	`;
};

//================================================================================

const sendEmail = async (req) => {
	// rand = Math.floor(Math.random() * (1000000 - 100000));
	rand = Math.floor(100000 + Math.random() * 900000);

	host = req.get("host");
	link = "http://" + req.get("host") + "/verify?id=" + rand;
	mailOptions = {
		from: "no-replay@muzzlimate.com",
		to: req.body.email,
		subject: "Please confirm your Email account",
		html: htmlTemlplate(rand),
	};
	// console.log(rand);

	smtpTransport.sendMail(mailOptions, function (error, response) {
		if (error) {
			console.log(error);
			// res.end("error");
			return "error";
		} else {
			console.log("Message sent: " + response.message);
			// res.end("sent");
			return "sent";
		}
	});
};

router.get(
	"/autologin",
	passport.authenticate("jwt", { session: false }),
	(req, res) => {
		const token = jwt.sign(req.user.id, mySecretKey);
		const newUser = {};
		newUser.id = "Bearer " + token;
		newUser.firstName = req.user.firstName;
		newUser.email = req.user.email;
		newUser.image = req.user.image;
		newUser.isVerified = req.user.isVerified;
		newUser.likes = req.user.likes;
		newUser.dislikes = req.user.dislikes;
		newUser.album = req.user.album;
		newUser.job = req.user.job;
		newUser.ethnic = req.user.ethnic;
		newUser.bornPlace = req.user.bornPlace;
		newUser.location = req.user.location;
		newUser.senderId = req.user.senderId;
		newUser.chatMessageSeenInfo = req.user.chatMessageSeenInfo;
		newUser.seen = req.user.seen;
		newUser.bio = req.user.bio;
		newUser.token = req.user.token;
		newUser.education = req.user.education;
		newUser.isPremuim = req.user.isPremuim;
		newUser.sect = req.user.sect;
		newUser.religious = req.user.religious;
		newUser.pray = req.user.pray;
		newUser.drinking = req.user.drinking;
		newUser.smoking = req.user.smoking;
		newUser.maritalStatus = req.user.maritalStatus;
		newUser.children = req.user.children;
		newUser.height = req.user.height;
		newUser.canSwip = req.user.canSwip;
		newUser.prevSwip = req.user.prevSwip;
		newUser.likedMe = req.user.likedMe;
		newUser.visitedMe = req.user.visitedMe;
		newUser.created_at = req.user.created_at;
		res.status(200).json({ user: newUser });
	}
);

//save location anytime user login to the app
router.post(
	"/location",
	passport.authenticate("jwt", { session: false }),
	(req, res) => {
		if (req.hasOwnProperty("user")) {
			MongoClient.connect(DB, { useUnifiedTopology: true }, async (_, db) => {
				await db
					.db("test")
					.collection("users")
					.updateOne(
						{ _id: req.user._id },
						{ $set: { location: req.body.location } }
					);
				db.close();
			});
			res.status(200).json({ msg: "done" });
		}
	}
);

router.get(
	"/index",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const { id, likes, dislikes } = req.user;
		const users = await User.find({
			$and: [
				{ _id: { $ne: id } },
				{ _id: { $nin: likes } },
				{ _id: { $nin: dislikes } },
			],
		});
		return res.status(200).json({ users: users });
	}
);

router.post("/signup", async (req, res) => {
	const { isValid, errors } = validateRegisterInput(req.body);
	const { firstName, image, email, password, gender, location } = req.body;

	// let verificationCode = rand;
	if (!isValid) {
		res.status(404).json({ error: errors });
	}
	try {
		let user = await User.findOne({ email: email });
		if (user) {
			return res.status(400).json({ error: "This email already exist" });
		}
		await sendEmail(req);

		user = new User({
			firstName,
			email,
			password,
			image,
			verificationCode: rand,
			gender,
			location,
		});

		const salt = bcrypt.genSaltSync(10);
		const hash = bcrypt.hashSync(password, salt);
		user.password = hash;
		await user.save();

		//create token for user is
		const token = jwt.sign(user.id, mySecretKey);

		const newUser = {};
		newUser.id = "Bearer " + token;
		newUser.firstName = user.firstName;
		newUser.email = user.email;
		newUser.profileImage = user.image;
		newUser.isVerified = user.isVerified;
		newUser.likes = user.likes;
		newUser.dislikes = user.dislikes;
		newUser.created_at = user.created_at;

		return res.status(200).json({ user: newUser });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error: error });
	}
});

router.post("/login", async (req, res) => {
	const { errors, isValid } = validateLoginInput(req.body);
	const { email, password } = req.body;
	if (!isValid) {
		res.status(404).json({ error: errors });
	}
	try {
		const user = await User.findOne({ email: email });
		if (!user) {
			res.status(404).json({ msg: "This user not exist" });
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (isMatch) {
			const token = jwt.sign(user.id, mySecretKey);
			const newUser = {};
			newUser.id = "Bearer " + token;
			newUser.firstName = user.firstName;
			newUser.email = user.email;
			newUser.image = user.image;
			newUser.isVerified = user.isVerified;
			newUser.likes = user.likes;
			newUser.dislikes = user.dislikes;
			newUser.album = user.album;
			newUser.job = user.job;
			newUser.ethnic = user.ethnic;
			newUser.bornPlace = user.bornPlace;
			newUser.location = user.location;
			newUser.senderId = user.senderId;
			newUser.chatMessageSeenInfo = user.chatMessageSeenInfo;
			newUser.seen = user.seen;
			newUser.bio = user.bio;
			newUser.token = user.token;
			newUser.education = user.education;
			newUser.isPremuim = user.isPremuim;
			newUser.sect = user.sect;
			newUser.religious = user.religious;
			newUser.pray = user.pray;
			newUser.drinking = user.drinking;
			newUser.smoking = user.smoking;
			newUser.maritalStatus = user.maritalStatus;
			newUser.children = user.children;
			newUser.height = user.height;
			newUser.canSwip = user.canSwip;
			newUser.prevSwip = user.prevSwip;
			newUser.likedMe = user.likedMe;
			newUser.visitedMe = user.visitedMe;

			res.status(200).json({ user: newUser });
		}
	} catch (error) {
		res.status(404).json({ error: error });
		console.log(error);
	}
});

router.get("/", (req,res)=>{
	res.status(200).json({hi: "hello"})
});

//delete useraccount from DB
router.delete(
	"/deleteAccount",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		let all = [...req.user.image, ...req.user.album];
		removeMultipleImages(all);
		let user = await User.deleteOne({ _id: req.user.id });

		if (user.n > 0) {
			return res.status(200).json({ msg: "deleted" });
		}
	}
);

router.post("/check", async (req, res) => {
	const user = await User.findOne({ email: req.body.email });
	return res.json({ msg: user });
});

router.post("/googlesignup", async (req, res) => {
	const { firstName, lastName, email, image } = req.body;

	try {
		let user = await User.findOne({ email: email });
		if (user) {
			return res.status(400).json({ msg: "This email already exist" });
		}
		user = new User({
			firstName,
			lastName,
			email,
			image,
		});

		await user.save();

		//create token for user is
		const token = jwt.sign(user.id, mySecretKey);

		const newUser = {};
		newUser.firstName = user.firstName;
		newUser.lastName = user.lastName;
		newUser.email = user.email;
		newUser.likes = user.likes;
		newUser.dislikes = user.dislikes;
		newUser.id = "Bearer " + token;
		newUser.created_at = user.created_at;
		newUser.image = user.image;

		res.status(200).json({ user: newUser });
	} catch (error) {
		res.status(500).json({ error: error });
		console.log(error);
	}
});

router.post("/googlelogin", async (req, res) => {
	const { email } = req.body;

	try {
		const user = await User.findOne({ email: email });
		if (!user) {
			res.status(404).json({ msg: "This user not exist" });
		}

		if (user) {
			const token = jwt.sign(user.id, mySecretKey);
			const newUser = {};
			newUser.id = "Bearer " + token;
			newUser.firstName = user.firstName;
			newUser.lastName = user.lastName;
			newUser.email = user.email;
			newUser.likes = user.likes;
			newUser.dislikes = user.dislikes;
			newUser.created_at = user.created_at;
			newUser.image = user.image;

			res.status(200).json({ user: newUser });
		}
	} catch (error) {
		res.status(404).json({ error: error });
		console.log(error);
	}
});

router.patch(
	"/activateUser",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const {
			age,
			children,
			maritalStatus,
			job,
			ethnic,
			sect,
			religious,
			pray,
			drinking,
			bornPlace,
			height,
			relocate,
			album,
			bio,
			smoking,
			education,
		} = req.body;
		let answer;
		MongoClient.connect(DB, { useUnifiedTopology: true }, async (_, db) => {
			answer = await db
				.db("test")
				.collection("users")
				.updateOne(
					{ email: req.user.email },
					{
						$set: {
							age,
							children,
							maritalStatus,
							job,
							ethnic,
							sect,
							religious,
							pray,
							drinking,
							bornPlace,
							height,
							relocate,
							album,
							selfie: req.body.selfiAws,
							smoking,
							education,
							bio,
						},
					}
				);
			db.close();
		});
		res.json({ msg: "done" });
	}
);

router.patch(
	"/match",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			await User.updateOne(
				{ email: req.user.email },
				{ $addToSet: { likes: req.body.likeId } },
				{ unique: true }
			);

			const user = await User.findById(req.body.likeId);

			// console.log(user.firstName, user.likes.includes(req.user.id));
			if (user.likes.includes(req.user.id)) {
				await User.updateOne(
					{ email: req.user.email },
					{ $addToSet: { matches: req.body.likeId } },
					{ unique: true }
				);
				await User.updateOne(
					{ _id: req.body.likeId },
					{ $addToSet: { matches: req.user.id } },
					{ unique: true }
				);
				return res.status(200).json({
					userImage: user.image,
					found: true,
					firstName: user.firstName,
					user: user,
				});
			} else {
				await User.updateOne(
					{ _id: req.body.likeId },
					{ $addToSet: { likedMe: req.user.id } },
					{ unique: true }
				);
				return res.status(200).json({ found: false });
			}
		} catch (error) {
			console.log("error from likes func", error);
		}
	}
);
// update user with notification token
router.patch("/addToken", async (req, res) => {
	let { email, token } = req.body;
	console.log(email);
	let user = await User.updateOne({ email }, { token });
	res.json(user);
});
//===============ADMIN SIGN UP OR LOGIN ===================//

router.post("/adminSign", async (req, res) => {
	const { isValid, errors } = validateRegisterInput(req.body);
	const { firstName, email, password } = req.body;

	if (!isValid) {
		res.status(404).json({ error: errors });
	}
	try {
		let user = await User.findOne({ email: email });
		if (user) {
			return res.status(400).json({ error: "This email already exist" });
		}
		// await sendEmail(req);
		if (!user && adminKey === req.body.adminKey) {
			// debugger
			console.log("you here");

			user = new User({
				firstName,
				email,
				password,
				isSuperAdmin: true,
				isVerified: true,
			});
			const salt = bcrypt.genSaltSync(10);
			const hash = bcrypt.hashSync(password, salt);
			user.password = hash;
			await user.save();
			//create token for user is
			const token = jwt.sign(user.id, mySecretKey);
			const newUser = {};
			newUser.id = "Bearer " + token;
			newUser.firstName = user.firstName;
			newUser.email = user.email;
			newUser.profileImage = user.image;
			newUser.isVerified = user.isVerified;
			newUser.created_at = user.created_at;
			return res.status(200).json({ user: newUser });
		} else {
			res.json({ adminKey: "wrong key" });
		}
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error: error });
	}
});

router.post("/adminLogin", async (req, res) => {
	const { errors, isValid } = validateLoginInput(req.body);
	const { email, password } = req.body;
	if (!isValid) {
		res.status(404).json({ error: errors });
	}
	try {
		const user = await User.findOne({ email: email });
		if (!user) {
			res.status(404).json({ msg: "This user not exist" });
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (isMatch) {
			const token = jwt.sign(user.id, mySecretKey);
			const newUser = {};
			newUser.firstName = user.firstName;
			newUser.email = user.email;
			newUser.id = "Bearer " + token;
			newUser.created_at = user.created_at;

			res.status(200).json({ user: newUser });
		}
	} catch (error) {
		res.status(404).json({ error: error });
		console.log(error);
	}
});

router.get(
	"/adminAutoLogin",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		let user = req.user;
		const token = jwt.sign(user.id, mySecretKey);
		const newUser = {};
		newUser.firstName = user.firstName;
		newUser.email = user.email;
		newUser.id = "Bearer " + token;
		newUser.created_at = user.created_at;

		res.status(200).json({ user: newUser });
	}
);
router.post("/removeImage", async (req, res) => {
	const resp = deletImage(req.body.user);
	const { email } = req.body.user;
	console.log(req.body.user.email);

	MongoClient.connect(DB, { useUnifiedTopology: true }, async (_, db) => {
		await db
			.db("test")
			.collection("users")
			.updateOne({ email: email }, { $unset: { selfie: "" } });
		db.close();
	});

	return res.status(200).json({ msg: "ok" });
});

router.post("/removeImages", async (req, res) => {
	removeImages(req.body.link);
	const { email } = req.body;
	let update = await User.updateOne(
		{ email: email },
		{ $pull: { album: req.body.link } }
	);
	let user = await User.findOne({ email: email });
	if (update.n > 0) {
		res.status(200).json({ user: user });
	}
});

router.post("/removeProfileImage", async (req, res) => {
	deletImage(req.body.user);
	const { email } = req.body.user;
	console.log(email);
	let update = await User.updateOne({ email: email }, { $set: { image: "" } });
	let user = await User.findOne({ email: email });
	if (update.n > 0) {
		res.status(200).json({ user: user });
	}
});

router.post("/accepteSelfie", (req, res) => {
	const resp = deletImage(req.body.user);
	const { email } = req.body.user;
	console.log(req.body.user.email);

	MongoClient.connect(DB, { useUnifiedTopology: true }, async (_, db) => {
		await db
			.db("test")
			.collection("users")
			.updateOne(
				{ email: email },
				{ $unset: { selfie: "" }, $set: { isVerified: true } }
			);
		db.close();
	});

	return res.status(200).json({ msg: "ok" });
});

//===========================================================

router.post("/upload-image", upload.single("image"), (req, res) => {
	return res.status(201).json({ avatarLink: req.file.location });
});

router.post("/upload-images", upload.array("image", 6), (req, res) => {
	let arrayOfLinks = [];
	req.files.forEach((ele) => {
		arrayOfLinks.push(ele.location);
	});
	return res.status(201).json({ album: arrayOfLinks });
});
// //===============Email verification setting==================

// const smtpTransport = nodemailer.createTransport({
// 	service: "Gmail",
// 	auth: {
// 		user: Email,
// 		pass: emailPassword,
// 	},
// });

// let rand, mailOptions, host, link;

// // ==========
// const htmlTemlplate = (rand) => {
// 	return `Hello,<br> Please Enter the code below to verify your email.<br>
// 	<h4 style={color: "red"}>${rand}</h4><br>
// 	This code expires in 10 minutes
// 	`;
// };

router.post("/send", function (req, res) {
	// debugger;
	rand = Math.floor(Math.random() * (1000000 - 100000));
	host = req.get("host");
	link = "http://" + req.get("host") + "/verify?id=" + rand;
	mailOptions = {
		from: "no-replay@muzzlimate.com",
		to: req.body.email,
		subject: "Please confirm your Email account",
		html: htmlTemlplate(rand),
	};
	// console.log(rand);

	smtpTransport.sendMail(mailOptions, function (error, response) {
		if (error) {
			console.log(error);
			res.end("error");
		} else {
			console.log("Message sent: " + response.message);
			res.end("sent");
		}
	});
});

router.post("/verify", async function (req, res) {
	const { email, verificationCode } = req.body;
	const user = await User.findOne({ email: email });
	if (req.protocol + "://" + req.get("host") === "http://" + host) {
		//make sure to check if verificationCode is string or ingeter
		if (verificationCode === user.verificationCode) {
			// user.verificationCode =
			MongoClient.connect(DB, { useUnifiedTopology: true }, async (_, db) => {
				await db
					.db("test")
					.collection("users")
					.updateOne({ email: email }, { $unset: { verificationCode: "" } });
				db.close();
			});
			console.log("email is verified");
			return res.status(200).json({ msg: "sent" });
		} else {
			console.log("email is not verified");
			return res.status(404).json({ msg: "email is not verified" });
		}
	} else {
		return res.json({ msg: "Request is from unknown source" });
	}
});

// save when last time was the previous swip and count 12h for next swip
router.post("/preventLikes", async (req, res) => {
	let { canSwip, email } = req.body;
	try {
		let user = await User.updateOne(
			{ email },
			{ $set: { canSwip, prevSwip: new Date() } }
		);
		if (user.nModified > 0) {
			res.send("done");
		}
	} catch (error) {
		console.log("preventLikes", error);
	}
});

router.patch("/updatPrevSwip", async (req, res) => {
	let { canSwip, email } = req.body;
	try {
		let user = await User.updateOne(
			{ email },
			{ $set: { canSwip, prevSwip: new Date() } }
		);
		if (user.nModified > 0) {
			res.send("done");
		}
	} catch (error) {
		console.log("preventLikes", error);
	}
});

// const decode = async (token) => {
// 	let idDecoded = token.split(" ")[1];
// 	try {
// 		let id = jwt.verify(idDecoded, mySecretKey);
// 		let user = await User.findOne({ _id: id });
// 		let gender;
// 		if (user.gender === "Male") {
// 			gender = "Female";
// 		} else {
// 			gender = "Male";
// 		}

// 		const users = await User.find({
// 			$and: [
// 				{ _id: { $ne: user.id } },
// 				{ _id: { $nin: user.likes } },
// 				{ _id: { $nin: user.dislikes } },
// 				{ gender: gender },
// 			],
// 		});
// 		return users;
// 	} catch (error) {
// 		console.log("decode", error);
// 	}
// };

// get all info about who liked me or visited me or pass

router.get(
	"/getlists",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		let { action } = req.query;
		try {
			if (action === "likedMe") {
				let users = await User.find({ _id: req.user.likedMe });
				res.status(200).json({ users: users });
			} else if (action === "iLiked") {
				let users = await User.find({ _id: req.user.likes });
				res.status(200).json({ users: users });
			} else if (action === "passed") {
				let users = await User.find({ _id: req.user.dislikes });
				res.status(200).json({ users: users });
			} else if (action === "visitedMe") {
				let users = await User.find({ _id: req.user.visitedMe });
				res.status(200).json({ users: users });
			}
		} catch (error) {
			console.log("getlists", error);
			req.error();
		}
	}
);



// unmatch user and delete chat
router.patch(
	"/unmatch",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		if (req.body.chatId !== false) {
			let msg = await Message.deleteOne({ _id: req.body.chatId });

			let unmatching = await User.updateOne(
				{ _id: req.user.id },
				{ $pull: { matches: req.body.reciever } }
			);
			if (unmatching.n > 0 && msg.n > 0) {
				return res.status(200).json({ msg: "chat deleted" });
			} else {
				return res.status(400).json({ msg: " chat not deleted " });
			}
		} else if (req.body.chatId === false) {
			let unmatching = await User.updateOne(
				{ _id: req.user.id },
				{ $pull: { matches: req.body.reciever } }
			);

			if (unmatching.n > 0) {
				return res.status(200).json({ msg: "unmatched" });
			}
		}
	}
);

//get all user are not verified yet
const allUsers = async () => {
	const all = await User.find({ isVerified: false });
	return all;
};

// add like id to array and check if ther's a match
const match = async (data) => {
	let token = data.currentUserId.split(" ")[1];
	let idd = jwt.verify(token, mySecretKey);

	try {
		await User.updateOne(
			{ email: data.email },
			{ $addToSet: { likes: data.likeId } },
			{ unique: true }
		);

		const user = await User.findById(data.likeId);
		if (user.likes.includes(idd)) {
			return { userImage: user.image, found: true, firstName: user.firstName };
		} else {
			return { found: false };
		}
	} catch (error) {
		console.log("error from likes func", error);
	}
};

//add dislike to user array
router.patch("/dislikes", async (req, res) => {
	let idDecoded = req.body.currentUserId.split(" ")[1];
	let id = jwt.verify(idDecoded, mySecretKey);
	try {
		let result = await User.updateOne(
			{ email: req.body.currentUserEmail },
			{ $addToSet: { dislikes: req.body.disLikeId } },
			{ unique: true }
		);
		await User.updateOne(
			{ _id: req.body.disLikeId },
			{ $addToSet: { visitedMe: id } },
			{ unique: true }
		);
		return res.status(200).json({ msg: "Done" });
	} catch (error) {
		console.log("error from dislikes router", error);
	}
});

//sort users base on date
const sortArray = (arr) => {
	return arr.sort((a, b) => {
		return new Date(a.chatMessageSeenInfo[0].createdAt).getTime() >
			new Date(b.chatMessageSeenInfo[0].createdAt).getTime()
			? -1
			: 1;
	});
};

//update user info with new ones dynamicly
router.patch("/updateUserInfo", async (req, res) => {
	let { email } = req.body;
	let answer = _.pick(req.body, (value, key, object) => {
		if (value.length > 0 && value !== "4'4" && key !== "email") {
			return object;
		}
	});
	let userUpdated = await User.updateOne(
		{ email: email },
		{
			$set: answer,
		}
	);

	// if (userUpdated.n > 0) {
	// 	let user = await User.findOne({ email: email });
	// }

	res.status(200).json({ msg: "done" });
});

const countAll = (arg) => {
	let answer = [];
	for (let index = 0; index < arg.length; index++) {
		const ele = arg[index];
		if (ele.chatMessageSeenInfo.length > 0) {
			answer.push(true);
		} else {
			answer.push(false);
		}
	}
	return answer;
};

//get all user matches and sort them base on time send msg with http not socket
router.get(
	"/allMatches",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		// let user = await User.findById(req.user.id);
		let user = req.user;
		let allUser = await User.find({ _id: { $in: user.matches } });
		let count = countAll(allUser);
		let all = _.every(count, (ele) => {
			return ele === true;
		});

		if (all) {
			let answer = await sortArray(allUser);
			res.status(200).json(answer);
		} else if (allUser.length > 0 || !check) {
			res.status(200).json(allUser);
		}
	}
);

//get chat messages When user navigate to screen of pm
router.post(
	"/getChat",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		let msg = await Message.findOne({
			usersIds: { $all: [req.body.reciever, req.user.id] },
		});
		if (msg !== null) {
			res.status(200).json(msg);
		}
	}
);
//save empty first message to createrooms for socket io
router.patch(
	"/emptyMessage",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const createMessage = new Message({
			// userSender: sender,
			// userReciever: data.reciever,
			usersIds: [req.user.id, req.body.reciever],
			messages: [
				{
					msg: req.body.message,
					authorId: req.user.id,
					createdAt: new Date(),
				},
			],
			usersIds: [req.user.id, req.body.reciever],
		});
		createMessage.save();
		res.status(200).json(createMessage);
	}
);

//get all user that match in both side // not working anymore using router.get(/allMatches) instead
const allMatches = async (data) => {
	let token = data.split(" ")[1];
	let id = jwt.verify(token, mySecretKey);
	let user = await User.findById(id);
	let allUser = await User.find({ _id: { $in: user.matches } });
	let answer = sortArray(allUser);
	return allUser;
};

//to change match position with chat or without
const userMessages = async (sender, reciever) => {
	console.log(sender, reciever);
	let user1 = await User.updateMany(
		{ _id: { $in: [sender, reciever] } },
		{
			$set: { hasMessages: true },
		}
	);
	return user1;
};

// save messages in db
const saveMessages = async (data) => {
	let token = data.sender.split(" ")[1];
	let sender = jwt.verify(token, mySecretKey);

	try {
		const msg = await Message.findOne({
			usersIds: { $all: [data.reciever, sender] },
		});

		if (msg) {
			const pushMessage = await Message.updateOne(
				//query for all ids insides of usersIds fields
				{ usersIds: { $all: [data.reciever, sender] } },
				{
					$push: {
						messages: {
							msg: data.message,
							authorId: sender,
							createdAt: new Date(),
						},
						$sort: { createdAt: 1 },
					},
					emptyMessages: true,
					seen: false,
				}
			);
			await userMessages(sender, data.reciever);
			let msg2 = await Message.findOne({
				usersIds: { $all: [data.reciever, sender] },
			});
			return msg2;
		} else if (msg === null) {
			const createMessage = new Message({
				// userSender: sender,
				// userReciever: data.reciever,
				usersIds: [sender, data.reciever],
				messages: [
					{
						msg: data.message,
						authorId: sender,
						createdAt: new Date(),
					},
				],
				usersIds: [sender, data.reciever],
			});
			// await userMessages(sender, data.reciever);
			createMessage.save();
			return createMessage;
		}
	} catch (error) {
		console.log("error from saveMessages func", error);
	}
};

//messages are seend from user
const isSeen = async (data) => {
	const messages = await User.updateOne(
		{
			email: data.sender,
			"chatMessageSeenInfo.senderEmail": data.reciever,
			"chatMessageSeenInfo.chatId": data.chatId,
		},
		{ "chatMessageSeenInfo.$.seen": true }
	);

	return messages;
};

//check reciver chatinfo if hi has chat id in his array list
const checkIncludesChatId = (user, chatId) => {
	let arr = user.chatMessageSeenInfo;
	for (let i = 0; i < arr.length; i++) {
		const ele = arr[i];
		if (ele.chatId === chatId) {
			return true;
		} else {
			return false;
		}
	}
};

//check if the user read the message
const checkIdBadge = async (senderEmail, recieverEmail, chatId) => {
	let id = chatId;

	try {
		const user = await User.findOne({
			email: recieverEmail,
		});
		let checkAnswer = checkIncludesChatId(user, chatId);
		console.log(checkAnswer);
		if (checkAnswer === false || checkAnswer === undefined) {
			const result = await User.updateOne(
				{
					email: recieverEmail,
					// "chatMessageSeenInfo.chatId": chatId,
				},
				{
					$addToSet: {
						chatMessageSeenInfo: {
							senderEmail,
							seen: false,
							chatId: id,
							createdAt: new Date(),
						},
					},
					unique: true,
				}
			);
			return result;
		} else if (checkAnswer) {
			const result = await User.updateOne(
				{
					email: recieverEmail,
					"chatMessageSeenInfo.chatId": chatId,
					"chatMessageSeenInfo.senderEmail": senderEmail,
				},
				{
					"chatMessageSeenInfo.$.seen": false,
					"chatMessageSeenInfo.$.createdAt": new Date(),
				}
			);
			return result;
		}
	} catch (error) {
		console.log("erro", error);
	}
};

//update the current user of client and get all messages belong to currentUser
const autoLoginAndMessages = async (data) => {
	let arr = [];
	try {
		let token = data.currentToken.split(" ")[1];
		let currentId = jwt.verify(token, mySecretKey);
		let user = await User.findById(currentId);

		await user.chatMessageSeenInfo.forEach((ele) => {
			arr.push(ele.chatId);
		});
		let messages = await Message.find(
			{
				_id: { $in: arr },
			},
			{
				messages: { $slice: -1 },
			}
		);

		const tokenn = jwt.sign(user.id, mySecretKey);
		const newUser = {};
		newUser.id = "Bearer " + tokenn;
		newUser.firstName = user.firstName;
		newUser.email = user.email;
		newUser.image = user.image;
		newUser.isVerified = user.isVerified;
		newUser.likes = user.likes;
		newUser.dislikes = user.dislikes;
		newUser.album = user.album;
		newUser.job = user.job;
		newUser.ethnic = user.ethnic;
		newUser.bornPlace = user.bornPlace;
		newUser.location = user.location;
		newUser.senderId = user.senderId;
		newUser.chatMessageSeenInfo = user.chatMessageSeenInfo;
		newUser.seen = user.seen;
		newUser.bio = user.bio;
		newUser.education = user.education;
		newUser.isPremuim = user.isPremuim;
		newUser.sect = user.sect;
		newUser.religious = user.religious;
		newUser.pray = user.pray;
		newUser.drinking = user.drinking;
		newUser.smoking = user.smoking;
		newUser.maritalStatus = user.maritalStatus;
		newUser.children = user.children;
		newUser.height = user.height;
		newUser.canSwip = user.canSwip;
		newUser.prevSwip = user.prevSwip;

		newUser.created_at = user.created_at;

		return [newUser, messages];
	} catch (error) {
		console.log("autoLoginAndMessages", error);
	}
};

const decode = async (token) => {
	let idDecoded = token.split(" ")[1];
	try {
		let id = jwt.verify(idDecoded, mySecretKey);
		let user = await User.findOne({ _id: id });
		let gender;
		if (user.gender === "Male") {
			gender = "Female";
		} else {
			gender = "Male";
		}

		const users = await User.find({
			$and: [
				{ _id: { $ne: user.id } },
				{ _id: { $nin: user.likes } },
				{ _id: { $nin: user.dislikes } },
				{ gender: gender },
			],
		});
		return users;
	} catch (error) {
		console.log("decode", error);
	}
};

const Socket = (io) => {
	io.of("/index").once("connect", (socket) => {
		// socket.emit("allUser", "hello");
		socket.once("fromClient", async (data) => {
			let answer = await decode(data);
			// checkOtherUserLikes(data)
			let date = new Date();
			socket.emit("allUserBack", { answer, date });
		});
	});

	io.of("/allMatches").once("connection", async (socket) => {
		socket.once("recieveUserId", async (data) => {
			result = await allMatches(data);
			socket.emit("allMatchBack", result);
		});

		socket.on("autoLoginSocket", async (data) => {
			const result = await autoLoginAndMessages(data);
			socket.emit("autoLoginSocketResp", result);
		});
	});

	const chat = io.of("/chat");
	chat.once("connect", async (socket) => {
		socket.once("recieveMessageClient", async (data) => {
			let token = data.sender.split(" ")[1];
			let sender = jwt.verify(token, mySecretKey);
			socket.join(
				[`${sender}.${data.reciever}`, `${data.reciever}.${sender}`],
				async () => {
					let roomName = Object.keys(socket.rooms)[1];
					let roomName2 = Object.keys(socket.rooms)[2];
					const result = await saveMessages(data);
					const user = await checkIdBadge(
						data.senderEmail,
						data.recieverEmail,
						result._id.toString()
					);
					// io.in(roomName).emit("messagesCreatedServer", result);
					chat.to(roomName, roomName2).emit("messagesCreatedServer", result);
				}
			);
		});

		// for make message seen
		socket.on("getSeen", async (data) => {
			const result = await isSeen(data);
			// console.log("done");
		});
	});

	io.of("/admin").once("connection", async (socket) => {
		let answer1 = await allUsers();
		socket.emit("fromServer", answer1);
	});
};

module.exports = {
	router: router,
	socket: Socket,
};
