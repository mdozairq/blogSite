const mongoose = require("mongoose");

const postSchema = {
	name: String,
	email: String,
	title: String,
	content: String,
	createdAt: {
		type: Date,
		default: Date.now
	}
}

const Post = mongoose.model("Post", postSchema);

exports.Post;