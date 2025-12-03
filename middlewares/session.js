const usersDB = require("../models/usersDB");

// admin session management
const validAdmin = (req, res, next) => {
    if (req.session.admin) {
      next();
    } else {
      res.redirect("/admin");
    }
  };

// user session management
const validUser = async (req, res, next) => {
  if (req.session.user) {
    req.session.user = await usersDB.findUserById(req.session.user[0]._id)
    next();
  } else {
    res.render('users/user-login',{user: [],status:'Please Login For This Feature',message:''});
  }
};

  module.exports = {
    validAdmin,
    validUser
  };