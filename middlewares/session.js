// admin session management
const validAdmin = (req, res, next) => {
    if (req.session.admin) {
      next();
    } else {
      res.redirect("/admin");
    }
  };

// user session management
const validUser = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.render('users/user-login',{user: [],status:'Please Login For This Feature',message:''});
  }
};

  module.exports = {
    validAdmin,
    validUser
  };