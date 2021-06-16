const mongoose = require('mongoose');
const { Schema } = mongoose;

const AccountSchema = new Schema({
	name: String,
	email: String,
	accountNumber: Number,
	balance: Number,
	transactions: [
		{
			sender: String,
			reciever: String,
			amount: Number,
			avlBaln: Number
		}
	]
});

module.exports = mongoose.model('Account', AccountSchema);
