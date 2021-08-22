//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const _ = require('lodash');
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const User = require('./models/users');
const { ensureAuthenticated, forwardAuthenticated } = require('./config/auth');


const app = express();

require('./config/passport')(passport);

app.set('view engine', 'ejs');
mongoose.connect("mongodb+srv://admin-ozair:process.env.MONGO_PASSWORD@cluster0.mcvc4.mongodb.net/blogDB", { useNewUrlParser: true, useUnifiedTopology: true }).then(() => console.log('MongoDB Connected')).catch(err => console.log(err));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const postSchema = {
  userId: String,
  name: String,
  email: String,
  title: String,
  content: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}

app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

const Post = mongoose.model("Post", postSchema);

const day = date.getDate();

app.get("/", function (req, res) {
Post.find({}, function (err, post) {
    if (!err)
      res.render("home", { postList: post });
  }).sort({ createdAt: 'desc' });
});

app.get("/about", function (req, res) {
  res.render("about");
})


app.get("/compose", ensureAuthenticated, function (req, res) {
  res.render("compose");
})

app.post("/compose",ensureAuthenticated, function (req, res) {
  console.log(req.user);
  const post = new Post({
    userId: req.user.id,
    name: req.user.name,
    email: req.user.email,
    title: req.body.postTitle,
    content: req.body.postBody,
    createdAt: Date()
  });

  post.save(function (err) {
    if (!err)
      res.redirect("/profile");
    else
      console.log(err);
  });

})

//profile
app.get('/profile', ensureAuthenticated, async (req, res) => {
  const requestedUserPost = await Post.find({userId: req.user.id});
  res.render('profile', {
    user: req.user,
    posts: requestedUserPost
  })
});

// Login page
app.get('/login', forwardAuthenticated, (req, res) => res.render('login'));

// Register Page
app.get('/register', forwardAuthenticated, (req, res) => res.render('register'));

// Register
app.post('/register', (req, res) => {
  const { name, phone, email, password1, password } = req.body;
  let errors = [];

  if (!name || !email || !password1 || !password) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (password1 != password) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      name,
      phone,
      email,
      password1,
      password
    });
  } else {
    User.findOne({ email: email }).then(user => {
      if (user) {
        errors.push({ msg: 'Email already exists' });
        res.render('register', {
          errors,
          name,
          phone,
          email,
          password1,
          password
        });
      } else {
        const newUser = new User({
          name,
          phone,
          email,
          password
        });

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => {
                req.flash(
                  'success_msg',
                  'You are now registered and can log in'
                );
                res.redirect('/login');
              })
              .catch(err => console.log(err));
          });
        });
      }
    });
  }
});

// Login
app.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
  })(req, res, next);
});

// Logout
app.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/login');
});

app.get("/:username/:userPostId", ensureAuthenticated, function (req, res) {

  const requestedUserName = req.params.username;
  const requestedPostId = req.params.userPostId;

  Post.findOne({ _id: requestedPostId }, function (err, post) {
    if (!err) {
      res.render("userPost", {
        user: req.user,
        id: post._id,
        name: post.name,
        title: post.title,
        content: post.content,
        date: post.createdAt
      });
    }
  });
});



app.get("/home/posts/:postId", async function (req, res) {

  const requestedPostId = req.params.postId;

  await Post.findOne({ _id: requestedPostId }, function (err, post) {
    if (!err) {
      res.render("post", {
        id: post._id,
        name: post.name,
        title: post.title,
        content: post.content,
        date: post.createdAt
      });
    }
  });

})



app.get("/edit/:username/:id", ensureAuthenticated, async function(req, res){
  const requestedPost =await Post.findById(req.params.id)
  res.render('edit', {user: req.user, post: requestedPost})
})

app.post("/update/:username/:id",ensureAuthenticated, async function (req, res) {

  await Post.update({ _id: req.params.id }, {
    userId: req.user.id,
    name: req.body.composerName,
    email: req.body.composerEmail,
    title: req.body.postTitle,
    content: req.body.postBody,
    createdAt: Date()
  },
    { overwrite: true },
    function (err) {
      if (!err) {
        console.log("Successfully Updated")
        res.redirect("/profile");
      } else {
        res.send(err);
      }
    });
})

app.get("/:id", async function (req, res) {
  await Post.findByIdAndDelete(req.params.id)
  res.redirect('/');

})


app.listen(process.env.PORT || 3000, function () {
  // body...
  console.log("Server is running on the port 3000");
});
