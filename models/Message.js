const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema({
	messages: [
		{
			type: Schema.Types.Object,
			
		},
	],
	usersIds: [
		{
			type: Schema.Types.ObjectId,
			ref: "User",
			// unique: true
		},
	],
	emptyMessages:{
		type: Boolean,
		default: false
	},
	seen: {
		type: Boolean,
		default: false
	},
	createAt: {
		type: Date,
		default: new Date
	}
});

module.exports = User = mongoose.model("messages", messageSchema);
