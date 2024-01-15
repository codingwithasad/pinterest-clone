var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const expressSession = require("express-session");
const flash = require('connect-flash');
const port = 3000;


var express = require('express');
const userModel = require('./routes/users');
const postModel = require('./routes/posts');
const passport = require('passport');
require('dotenv').config();
require('./routes/cloudinary')
const cloudinary = require('cloudinary');
const upload = require('./routes/multer');
const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));



var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(flash());
app.use(expressSession({
  resave: false,
  saveUninitialized: false,
  secret: "asad asad asad"
}));
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(usersRouter.serializeUser());
passport.deserializeUser(usersRouter.deserializeUser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.get('/', function (req, res) {
  // Check for an "error" query parameter in the URL
  const error = req.query.error || '';

  res.render('index', { error: error });
});

app.get('/login', function (req, res) {
  res.render("login", { error: req.flash("error") });
});

app.get('/feed', isAuthenticated, async function (req, res) {
  const allPosts = await postModel.find({}).populate("user");
  res.render("feed", { allPosts });
});

app.get('/search', isAuthenticated, async function (req, res) {
  const allPosts = await postModel.find({}).populate("user");
  res.render("search", { allPosts });
});

app.post('/getAllPosts', isAuthenticated, async function (req, res) {
  let payload = req.body.payload.trim();
  let search = await postModel.find({ imageText: { $regex: new RegExp(payload, 'i') } }).exec();
  search = search.slice(0, 10);
  res.send({ payload: search })
});

app.get('/profile', isAuthenticated, async function (req, res) {
  const userGender = await userModel.findOne({ username: req.session.passport.user });
  const user = await userModel.findOne({ username: req.session.passport.user })
    .populate("posts");

  // Check for success query parameter to display the success message
  const successMessage = req.query.success ? "Post was successfully deleted" : null;

  res.render("profile", { user, userGender, successMessage });
});

app.post("/upload", upload.single('file'), async function (req, res) {
  // Check if a file was provided
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  // Continue with the upload process
  try {
    const result = await cloudinary.v2.uploader.upload(req.file.path);
    const user = await userModel.findOne({ username: req.session.passport.user });
    const post = await postModel.create({
      imageText: req.body.fileCaption,
      image: result.secure_url,
      user: user._id
    });
    user.posts.push(post._id);
    await user.save();
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/delete-post/:postId', async (req, res) => {
  const postId = req.params.postId;

  try {
    // Find and delete the post by its ID
    await postModel.findByIdAndDelete(postId);
    
    // Redirect to the profile page with success query parameter
    res.redirect('/profile/#container4?success=true');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


app.post('/register', async function (req, res) {
  // Initialize the error variable
  let error = '';

  // Check if the username, email, and name are not empty
  if (!req.body.username || !req.body.email || !req.body.fullName) {
    error = 'All fields are required.';
    return res.render('index', { error: error });
  }

  try {
    // Check if the username already exists
    const existingUser = await userModel.findOne({ username: req.body.username });

    if (existingUser) {
      // Username already exists, return an error
      error = 'Username is already taken.';
      return res.render('index', { error: error });
    }

    // If the username is not taken, proceed with user registration
    const userData = new userModel({
      username: req.body.username,
      email: req.body.email,
      fullName: req.body.fullName,
      gender: req.body.gender
    });

    await userModel.register(userData, req.body.password);

    passport.authenticate("local")(req, res, function () {
      res.redirect("/feed");
    });
  } catch (err) {
    // Handle any potential errors here
    console.error(err);
    error = 'An error occurred during registration.';
    res.render('index', { error: error });
  }
});

app.post('/login', passport.authenticate("local", {
  successRedirect: "/feed",
  failureRedirect: "/login",
  failureFlash: true
}), function (req, res) {
});

app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) { return next(err) }
    res.redirect("/login")
  })
});

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}


app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});