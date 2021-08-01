//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const _ = require('lodash');
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');
mongoose.connect("mongodb://localhost:27017/blogDB", {useNewUrlParser: true, useUnifiedTopology: true});

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

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
//Post.createIndex();

// let postList = [];
const day = date.getDate();

app.get("/", function(req, res){
	Post.find({}, function(err, posts){
		if(!err)
		res.render("home", {postList: posts});
	}).sort({createdAt: 'desc'});
});

app.get("/about", function(req, res){
	res.render("about");
})


app.get("/contact", function(req, res){
	res.render("contact");
})

app.get("/compose", function(req, res){
  res.render("compose");
})

app.post("/compose", function(req, res){
  const post = new Post({
  	name: req.body.composerName, 
  	email: req.body.composerEmail, 
  	title: req.body.postTitle, 
  	content: req.body.postBody,
  	createdAt: Date()
  });
  console.log(day);
  post.save(function(err){
  	if(!err)
  		res.redirect("/");
    else
    console.log(err);
  });

})

app.get("/posts/:postId", function(req, res){

  const requestedPostId = req.params.postId;
  //console.log(requestedPostId);
  
  Post.findOne({_id: requestedPostId}, function(err, post){
  	if(!err){
  	res.render("post", {
      id: post._id,
  		name: post.name,
  	 	title : post.title,
  	  content: post.content,
  	   date:post.createdAt
  	   });
  }
  });

})

app.get("/next/:postId", function(req, res){

  const requestedPostId = req.params.postId;
  console.log(requestedPostId);
  
  Post.find({_id: {$gt: requestedPostId}}, async function(err, post){
    if(!err){
    // res.render("post", {
    //   id: post._id,
    //   name: post.name,
    //   title : post.title,
    //   content: post.content,
    //    date:post.createdAt
    //    });
    await res.redirect("/posts/requestedPostId")
  }
  }).sort({_id: 1 }).limit(1);

})


app.get("/edit/:id", async function(req, res){
  const requestedPost =await Post.findById(req.params.id)
  res.render('edit', {post: requestedPost})
})

app.post("/posts/edit/:id", function(req, res){
  console.log(req.params.id)
  Post.update({_id: req.params.id},{
    name: req.body.composerName, 
    email: req.body.composerEmail, 
    title: req.body.postTitle, 
    content: req.body.postBody,
    createdAt: Date()
  },
    {overwrite: true},
    function(err){
      if (!err){
        console.log("Successfully Updated")
        res.redirect("/");
      } else {
        res.send(err);
      }
    });
})


app.get("/:id", async function(req, res){
    await Post.findByIdAndDelete(req.params.id)
      res.redirect('/');
    
})

app.listen(process.env.PORT || 3000, function () {
	// body...
	console.log("Server is running on the port 3000");
});