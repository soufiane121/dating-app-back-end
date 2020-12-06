const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
	firstName: {
		type: String,
		required: true,
	},
	bio: {
		type: String,
	},
	image: {
		type: String,
		// required: true,
	},
	email: {
		type: String,
		required: true,
		unique: true,
	},
	password: {
		type: String,
		// required: true
	},
	verificationCode: {
		type: String,
	},
	isVerified: {
		type: Boolean,
		default: false,
	},
	isPremuim: {
		type: Boolean,
		default: false,
	},
	likes: [
		{
			unique: true,
			type: Schema.Types.ObjectId,
			ref: "User",
		},
	],
	dislikes: [
		{
			type: Schema.Types.ObjectId,
			ref: "User",
			unique: true,
		},
	],
	matches: [
		{
			unique: true,
			type: Schema.Types.ObjectId,
			ref: "User",
		},
	],
	likedMe: [
		{
			unique: true,
			type: Schema.Types.ObjectId,
			ref: "User",
		},
	],
	visitedMe: [
		{
			unique: true,
			type: Schema.Types.ObjectId,
			ref: "User",
		},
	],
	location: {
		type: Object,
	},
	isSuperAdmin: {
		type: Boolean,
		default: false,
	},
	gender: {
		type: String,
	},
	age: {
		type: String,
	},
	children: {
		type: String,
	},
	maritalStatus: {
		type: String,
	},
	job: {
		type: String,
	},
	ethnic: {
		type: String,
	},
	sect: {
		type: String,
	},
	religious: {
		type: String,
	},
	token: {
		type: String,
	},
	pray: {
		type: String,
	},
	smoking: {
		type: String,
	},
	drinking: {
		type: String,
	},
	bornPlace: {
		type: String,
	},
	height: {
		type: String,
	},
	relocate: {
		type: String,
	},
	album: {
		type: Array,
	},
	selfie: {
		type: String,
	},
	education: {
		type: String,
	},
	hasMessages: {
		type: Boolean,
		default: false,
	},
	chatMessageSeenInfo: [
		{
			type: Object,
			unique: true,
		},
	],
	filterAge: {
		type: Object,
	},
	filterHeight: {
		type: Object,
	},
	filterDistance: {
		type: String,
	},
	filterSect: {
		type: String,
	},
	filterEthnicity: {
		type: String,
	},
	filterMarital: {
		type: String,
	},
	filterEducation: {
		type: String,
	},
	filterPray: {
		type: String,
	},
	filterReligious: {
		type: String,
	},
	filterChild: {
		type: String,
	},
	canSwip: {
		type: Boolean,
	},
	prevSwip: {
		type: Date,
	},
	create_at: {
		type: Date,
		default: Date.now,
	},
});

module.exports = User = mongoose.model("users", UserSchema);
