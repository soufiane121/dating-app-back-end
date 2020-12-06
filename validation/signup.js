const Validator = require("validator");
const validText = require("./validText");

module.exports = function validateRegisterInput(data) {
	let errors = {};

	data.firstName = validText(data.firstName) ? data.firstName : "";
	data.lastName = validText(data.lastName) ? data.lastName : "";
	data.email = validText(data.email) ? data.email : "";
	data.password = validText(data.password) ? data.password : "";
	//   data.password2 = validText(data.password2) ? data.password2 : '';

	if (!Validator.isLength(data.firstName, { min: 4, max: 15 })) {
		errors.firstName = "first name must be at least 4 character";
	}

	if (Validator.isEmpty(data.firstName)) {
		errors.firstName = " first name field is required";
	}
	// if (Validator.isEmpty(data.lastName)) {
	// 	errors.lastName = "last name field is required";
	// }

	if (Validator.isEmpty(data.email)) {
		errors.email = "Email field is required";
	}

	// if (!Validator.isEmail(data.email.trim())) {
	// 	errors.email = "Email is invalid";
	// }

	if (Validator.isEmpty(data.password)) {
		errors.password = "Password field is required";
	}

	if (!Validator.isLength(data.password, { min: 4, max: 30 })) {
		errors.password = "Password must be at least 4 characters";
	}

	//   if (Validator.isEmpty(data.password2)) {
	//     errors.password2 = 'Confirm Password field is required';
	//   }

	//   if (!Validator.equals(data.password, data.password2)) {
	//     errors.password2 = 'Passwords must match';
	//   }

	return {
		errors,
		isValid: Object.keys(errors).length === 0,
	};
};