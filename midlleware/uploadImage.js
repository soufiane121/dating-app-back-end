const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const fs = require("fs");
// const config = require("../config/keys");

// aws.config.update({
// 	secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
// 	accessKeyId: config.AWS_ACCESS_KEY_ID,
// 	region: "us-east-1",
// });
aws.config.update({
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	region: "us-east-1",
});

const s3 = new aws.S3();

const fileFilter = (req, file, cb) => {
	if (
		file.mimetype === "image/jpeg" ||
		file.mimetype === "image/png" ||
		file.mimetype === "image/jpg"
	) {
		cb(null, true);
	} else {
		cb(new Error("Invalid Mime Type, only JPEG, JPG PNG"), false);
	}
};

//delete profile image
const deletImage = async (user) => {
	let key = user.image.split("com/")[1];

	return s3.deleteObject(
		{
			Bucket: config.BUCKET,
			Key: key,
		},
		function (err, data) {}
	);
};

//delete image from album
const removeImages = async (link) => {
	let key = link.split("com/")[1];
	return s3.deleteObject(
		{
			Bucket: config.BUCKET,
			Key: key,
		},
		function (err, data) {}
	);
};

const returnArr = (arr) => {
	let answer = [];
	arr.forEach((ele) => {
		answer.push({ Key: ele.split("com/")[1] });
	});
	return answer;
};

const removeMultipleImages = async (arr) => {
	return s3.deleteObjects({
		Bucket: config.BUCKET,
		Delete: {
			Objects: returnArr(arr),
		},
	});
};
const upload = multer({
	fileFilter,
	storage: multerS3({
		s3,
		bucket: config.BUCKET,
		acl: "public-read",
		metadata: function (req, file, cb) {
			cb(null, { fieldName: file.fieldname });
		},

		key: function (req, file, cb) {
			cb(null, Date.now().toString() + file.originalname);
		},
	}),
	// limits: {
	// 	fileSize: 1024 * 1024 * 6, // we are allowing only 6 MB files
	// },
});

module.exports = {
	upload,
	deletImage,
	removeImages,
	removeMultipleImages,
};
