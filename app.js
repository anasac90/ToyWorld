var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const multer = require('multer');
const { connectDB } = require("./configure/db-connect");
require('dotenv').config();
const session = require("express-session");
const methodOverride = require('method-override');


var app = express();

app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));

var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');
const passport = require('./configure/passport');



// // Set up storage for uploaded files
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//       cb(null, 'public/images');
//   },
//   filename: (req, file, cb) => {
//       cb(null, Date.now() + '-' + file.originalname);
//   }
// });

// const upload = multer({ storage: storage });




// Connect to the database
connectDB();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false},
  })
);


app.use(passport.initialize());
app.use(passport.session());
app.use('/', usersRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
