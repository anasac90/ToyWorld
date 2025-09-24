const usersDB = require("../models/usersDB");
const productDB = require("../models/productDB");
const categoryDB = require("../models/categoryDB");
const addressDB = require("../models/addressDB");
const orderDB = require("../models/orderDB");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.OTP_MAIL,
    pass: process.env.MAIL_PASS,
  },
});

exports.login = (req, res) => {
  if (req.session.user) {
    res.redirect("/");
  } else {
    if (req.session.wrongUser) {
      res.render("users/user-login", {
        user: [],
        status: "",
        message: "Invalid Credential",
      });
    } else {
      res.render("users/user-login", { user: [], status: "", message: "" });
    }
  }
};

exports.forgetPassword = async (req, res) => {
  res.render("users/otp-sending", { user: [], email: '', status: "" });
}

exports.userHome = async (req, res) => {
  let products = await productDB.getProducts({ isDeleted: false });
  
  let categories = await categoryDB.getCategories({ isDeleted: false });
  if (req.session.user) {
    res.render("users/home", { user: req.session.user, products, categories });
  } else {
    res.render("users/home", { user: [], products, categories });
  }
};

exports.signUp = async (req, res) => {
  let email = req.body.email;
  let protectedPassword = await bcrypt.hash(req.body.password, 10);
  let user = {
    fname: req.body.fname,
    lname: req.body.lname,
    email: req.body.email,
    mobile: req.body.mobile,
    password: protectedPassword,
    isBlocked: false,
    isEmailVerified: false,
  };
  await usersDB.insertUser(user);
  res.render("users/otp-sending", { user: [], email, status: "" });
};

generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.sendOTP = async (req, res) => {
  const Email = req.body;

  let isEmailExist = await usersDB.findUser({ email: Email.email });
  if (isEmailExist.length == 0) {
    res.render("users/otp-sending", { user: [], email: null, status: "Entered email does not exist" });
  } else {
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    const newData = {
      otp: hashedOTP,
      otpExpiresAt: Date.now() + 300000,
    };
    await usersDB.updateUser(Email, newData);

    const mailOptions = {
      from: "the.toyworld.com@gmail.com",
      to: Email.email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).render("users/otp-sending", {
          user: req.session.user ? req.session.user : [],
          email: Email.email,
          status: "Error sending OTP",
        });
      }
    });
    if (req.body.forgetPassword) {
      res.render("users/otp-verification", {
        user: req.session.user ? req.session.user : [],
        email: Email.email,
        status: "OTP sent successfully, Please enter the OTP",
        warning: "",
        forgetPassword: true,
      });
    } else {
      res.render("users/otp-verification", {
        user: req.session.user ? req.session.user : [],
        email: Email.email,
        status: "OTP sent successfully, Please enter the OTP",
        warning: "",
        forgetPassword: false,
      });
    }
  }
};

exports.verifyOTP = async (req, res) => {
  console.log(req.body);

  let email = req.body.email;
  let otp = req.body.otp;
  let user = await usersDB.findUser({ email: email });
  if (user[0].otpExpiresAt < Date.now()) {
    res.render("users/otp-sending", {
      user: req.session.user ? req.session.user : [],
      email,
      status: "OTP expired, Please try again",
    });
  } else {
    const otpStatus = await bcrypt.compare(otp, user[0].otp);
    if (!otpStatus) {
      res.render("users/otp-verification", {
        user: req.session.user ? req.session.user : [],
        email,
        status: "",
        warning: "Invalid OTP, Please try again",
        forgetPassword: false,
      });
    } else {
      if (req.body.forgetPassword) {
        res.render("users/change-password", {
          user: req.session.user ? req.session.user : [],
          email,
          status: "Email verified, Kindly please update password",
          warning: "",
          forgetPassword: true,
        });
      } else {
        let Email = { email: email };
        let newData = { isEmailVerified: true };
        let OTPdata = { otp: "", otpExpiresAt: "" };
        let result = await usersDB.updateUser(Email, newData);
        if (req.session.user) {
          req.session.user = [result];
        }
        await usersDB.deleteField(Email, OTPdata);
        if (req.session.user) {
          res.render("users/my-account", {
            user: req.session.user,
            addresses: req.session.addresses ? req.session.addresses : [],
            orders: req.session.orders ? req.session.orders : [],
            status: "Email verified successfully",
            warning: null,
          });
        } else {
          res.render("users/user-login", {
            user: [],
            status: "Email verified successfully, Kindly please login",
            message: "",
          });
        }
      }

    }
  }
};

exports.validation = async (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let user = await usersDB.findUser({ email: email });
  if (user.length > 0) {
    if (
      user[0].email === email &&
      (await bcrypt.compare(password, user[0].password))
    ) {
      req.session.user = user;
      user_id = req.session.user[0]._id;
      req.session.addresses = await addressDB.findUserAddress(user_id);
      req.session.orders = await orderDB.userOrders(user_id);

      res.redirect("/");
    } else {
      req.session.wrongUser = true;
      res.redirect("/login");
    }
  } else {
    req.session.wrongUser = true;
    res.redirect("/login");
  }
};

exports.userProducts = async (req, res) => {
  let page = parseInt(req.query.page) || 1;
  let limit = 5; // Product count in each page
  let skip = (page - 1) * limit;

  // Get total product count
  let totalProducts = await productDB.getProducts({ isDeleted: false });
  totalProducts = totalProducts.length;

  let totalPages = Math.ceil(totalProducts / limit);

  let products = await productDB.getProducts({ isDeleted: false }, skip, limit);
  let categories = await categoryDB.getCategories();

  if (req.session.user) {
    res.render("users/products", { user: req.session.user, products, sortOption: null, categories, categoryOption: null, currentPage: page, totalPages });
  } else {
    res.render("users/products", { user: [], products, sortOption: null, categories, categoryOption: null, currentPage: page, totalPages });
  }
};

exports.productDetailed = async (req, res) => {
  let productCode = req.params.id;
  let product = await productDB.getProducts({ productCode: productCode });
  let category = product[0].category;
  let relatedProducts = await productDB.getProducts({
    category: category,
    isDeleted: false,
  });
  let products = relatedProducts;
  if (req.session.user) {
    res.render("users/product-detailed", {
      user: req.session.user,
      product,
      products,
    });
  } else {
    res.render("users/product-detailed", { user: [], product, products });
  }
};

exports.userCategories = async (req, res) => {
  let page = parseInt(req.query.page) || 1;
  let limit = 5; // Product count in each page
  let skip = (page - 1) * limit;

  let totalCategories = await categoryDB.getCategories({ isDeleted: false });
  totalCategories = totalCategories.length;

  let totalPages = Math.ceil(totalCategories / limit);

  let categories = await categoryDB.getCategories({ isDeleted: false }, skip, limit);
  if (req.session.user) {
    res.render("users/categories", { user: req.session.user, categories, currentPage: page, totalPages });
  } else {
    res.render("users/categories", { user: [], categories, currentPage: page, totalPages });
  }
};

exports.userManagement = async (req, res) => {
  let currentPage = parseInt(req.query.page) || 1;
  let limit = 6;
  let skip = (currentPage - 1) * limit;

  let totalUsers = await usersDB.findUser({});
  let totalUsersCount = totalUsers.length;
  let totalPages = Math.ceil(totalUsersCount / limit);

  let users = await usersDB.findUser({}, skip, limit);
  res.render("admin/users", { users, currentPage, totalPages });
};

exports.blockUser = async (req, res) => {
  let email = req.params.id;
  await usersDB.updateUser({ email: email }, { isBlocked: true });
  let users = await usersDB.findUser();
  res.render("admin/users", { users });
};

exports.unBlockUser = async (req, res) => {
  let email = req.params.id;
  await usersDB.updateUser({ email: email }, { isBlocked: false });
  let users = await usersDB.findUser();
  res.render("admin/users", { users });
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.render("users/user-login", {
    user: [],
    status: "Logout Sccessful",
    message: "",
  });
};

exports.userAccount = async (req, res) => {

  req.session.addresses = await addressDB.findUserAddress(user_id);
  req.session.orders = await orderDB.userOrders(user_id);

  res.render("users/my-account", {
    user: req.session.user,
    addresses: req.session.addresses ? req.session.addresses.reverse() : [],
    orders: req.session.orders ? req.session.orders.reverse() : [],
    status: null,
    warning: null,
    redirectTo: ''
  });
};

exports.editProfile = (req, res) => {
  res.render("users/edit-profile", { user: req.session.user, warning: null });
};

exports.updateProfile = async (req, res) => {
  let newData;
  if (req.session.user[0].email === req.body.email) {
    newData = {
      fname: req.body.fname,
      lname: req.body.lname,
      email: req.body.email,
      mobile: req.body.mobile,
    };
  } else {
    newData = {
      fname: req.body.fname,
      lname: req.body.lname,
      email: req.body.email,
      mobile: req.body.mobile,
      isEmailVerified: false,
    };
  }
  let result = await usersDB.updateUser(
    { email: req.session.user[0].email },
    newData
  );
  req.session.user = [result];
  res.render("users/my-account", {
    user: req.session.user,
    addresses: req.session.addresses ? req.session.addresses.reverse() : [],
    orders: req.session.orders ? req.session.orders.reverse() : [],
    status: "Profile updated successfully",
    warning: null,
    redirectTo: ''
  });
};

exports.changePassword = (req, res) => {
  res.render("users/change-password", {
    status: "",
    warning: "",
    forgetPassword: true,
    user: req.session.user,
    forgetPassword: false,
  });
};

exports.updatePassword = async (req, res) => {
  if (req.body.password === req.body.password2) {
    let verify = await bcrypt.compare(
      req.body.oldPassword,
      req.session.user[0].password
    );
    console.log(verify);
    if (verify) {
      let protPassword = await bcrypt.hash(req.body.password, 10);
      let result = await usersDB.updateUser(
        { email: req.session.user[0].email },
        { password: protPassword }
      );
      req.session.user = [result];
      res.render("users/my-account", {
        user: req.session.user,
        addresses: req.session.addresses ? req.session.addresses.reverse() : [],
        orders: req.session.orders ? req.session.orders.reverse() : [],
        status: "Password changed successfully",
        warning: null,
        redirectTo: ''
      });
    } else {
      res.render("users/change-password", {
        status: "",
        forgetPassword: true,
        user: req.session.user,
        warning: "Old password did not match, Please try again",
        forgetPassword: false,
      });
    }
  } else {
    res.render("users/change-password", {
      status: "",
      forgetPassword: true,
      user: req.session.user,
      warning: "New password mismtach, Please try again",
      forgetPassword: false,
    });
  }
};

exports.resetPassword = async (req, res) => {

  if (req.body.password === req.body.password2) {
    let protPassword = await bcrypt.hash(req.body.password, 10);
    let result = await usersDB.updateUser(
      { email: req.body.email },
      { password: protPassword }
    );
  }

  res.render("users/user-login", {
    user: [],
    status: "Password Reset Successful, Kindly login using new credential",
    message: "",
  });
}

exports.verifyEmail = (req, res) => {
  res.render("users/verify-email", { user: req.session.user, warning: null });
};
