//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const _ = require('lodash');
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const app = express();

app.set('view engine', 'ejs');
mongoose.connect("mongodb://localhost:27017/blogDB", {useNewUrlParser: true});

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const postSchema = {
	name: String,
	email: String,
	title: String,
	content: String
}

const Post = mongoose.model("Post", postSchema);


// let postList = [];
const day = date.getDate();

app.get("/", function(req, res){
	Post.find({}, function(err, posts){
		if(!err)
		res.render("home", {postList: posts, date:day});
	});
});

app.get("/about", function(req, res){
	res.render("about");
});


app.get("/contact", function(req, res){
	res.render("contact");
})

app.get("/compose", function(req, res){
  res.render("compose");
});

app.post("/compose", function(req, res){
  const post = new Post({
  	name: req.body.composerName, 
  	email: req.body.composerEmail, 
  	title: req.body.postTitle, 
  	content: req.body.postBody
  });
  post.save(function(err){
  	if(!err)
  		res.redirect("/");
  });
  
});

app.get("/posts/:postId", function(req, res){

  const requestedPostId = req.params.postId;
  console.log(requestedPostId);
  
  // postList.forEach(function(post){
  //   const storedTitle = _.lowerCase(post.title);
  //   console.log(storedTitle);

  Post.findOne({_id: requestedPostId}, function(err, post){
  	if(!err){
  	res.render("post", {
  		name: post.name,
  	 	title : post.title,
  	  	content: post.content,
  	   	date:day
  	   });
  }
  });

});

app.listen(process.env.PORT || 3000, function () {
	// body...
	console.log("Server is running on the port 3000");
});