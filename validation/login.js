const Validator = require("validator");
const validText = require("./validText");

module.exports = function validateLoginInput(data) {
	let errors = {};

	data.email = validText(data.email) ? data.email : '';
	// data.firstName = validText(data.firstName) ? data.firstName : "";
	data.password = validText(data.password) ? data.password : "";

	if (!Validator.isEmail(data.email)) {
	  errors.email = 'Email is invalid';
	}

	if (Validator.isEmpty(data.email)) {
	  errors.email = 'Email field is required';
	}

	// if (Validator.isEmpty(data.firstName)) {
	// 	errorr.firstName = "First name is required *";
	// }

	if (Validator.isEmpty(data.password)) {
		errors.password = "Password field is required";
	}

	return {
		errors,
		isValid: Object.keys(errors).length === 0,
	};
};
