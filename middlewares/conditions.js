const { use } = require("passport");
const usersDB = require("../models/usersDB");
const productDB = require("../models/productDB");
const { getCategories } = require("../models/categoryDB");
const { productDetailed } = require("../controllers/userController");
const fs = require("fs");

exports.isEmailExist = async (req, res, next) => {
  let user = [];
  user = await usersDB.findUser({ email: req.body.email });
  if (user.length > 0) {
    res.render("users/user-signup", {
      user: [],
      warning: "Email address you entered already exist",
      newUser: req.body,
    });
  } else {
    next();
  }
};

exports.isPasswordMatch = (req, res, next) => {
  if (req.body.password === req.body.password2) {
    next();
  } else {
    res.render("users/user-signup", {
      user: [],
      warning: "Password Mismatch, Please enter again",
      newUser: req.body,
    });
  }
};

exports.isBlocked = async (req, res, next) => {
  if (req.session.user) {
    let user = await usersDB.findUser({ email: req.session.user[0].email });
    if (user[0].isBlocked) {
      res.render("users/warning", {
        user,
        warning:
          "Sorry, Your account blocked.! Please contact customer care to know more.",
      });
    } else {
      next();
    }
  } else {
    next();
  }
};

exports.validProduct = async (req, res, next) => {
  if (req.body || req.files) {
    let productCodeResult = [];
    productCodeResult = await productDB.getProducts({productCode:req.body?.productCode});
    if (
      !req.body.productName ||
      !req.body.price ||
      !req.body.stockQuantity ||
      !req.body.productCode ||
      !req.body.minimumAge ||
      !req.body.category ||
      req.body.category == "Choose..." ||
      !req.body.brand ||
      req.body.brand == "Choose..." ||
      !req.body.productDescription ||
      req.files.length == 0
    ) {
      req.files?.forEach(file => {
        fs.unlink("./"+file.path,err=>{
          if(err) throw err;
        })
      });

      req.files = "";

      let status = "";
      let brands = ["brand1", "brand2", "brand3"];
      let warning = "Fill all the fields";
      let categoriesDocs = await getCategories();
      categories = categoriesDocs.map((data) => data.categoryName);
      let productData = req.body;
      let productImage = req.files;
      res.render("admin/add-product", {
        status,
        productData,
        productImage,
        warning,
        categories,
        brands,
      });
    } else if (req.body.price < 0 || req.body.stockQuantity < 0 || req.body.minimumAge < 0){
      let status = "";
      let brands = ["brand1", "brand2", "brand3"];
      let warning = "Price, Quantity and Minimum Age should be positive";

      req.files?.forEach(file => {
        fs.unlink("./"+file.path,err=>{
          if(err) throw err;
        })
      });

      req.files = "";

      let categoriesDocs = await getCategories();
      categories = categoriesDocs.map((data) => data.categoryName);
      let productData = req.body;
      let productImage = req.files;
      res.render("admin/add-product", {
        status,
        productData,
        productImage,
        warning,
        categories,
        brands,
      });
    } else if (productCodeResult?.length > 0){
      let status = "";
      let brands = ["brand1", "brand2", "brand3"];
      let warning = "Product Code already exist";

      req.files?.forEach(file => {
        fs.unlink("./"+file.path,err=>{
          if(err) throw err;
        })
      });

      req.files = "";

      let categoriesDocs = await getCategories();
      categories = categoriesDocs.map((data) => data.categoryName);
      let productData = req.body;
      let productImage = req.files;
      res.render("admin/add-product", {
        status,
        productData,
        productImage,
        warning,
        categories,
        brands,
      });
    } else {
      next();
    }
  } else {
    let status = "";
    let brands = ["brand1", "brand2", "brand3"];
    let warning = "Fill all the fields";

    req.files?.forEach(file => {
        fs.unlink("./"+file.path,err=>{
          if(err) throw err;
        })
      });

      req.files = "";

    let categoriesDocs = await getCategories();
    categories = categoriesDocs.map((data) => data.categoryName);
    let productData = req.body;
    let productImage = req.files;
    res.render("admin/add-product", {
      status,
      productData,
      productImage,
      warning,
      categories,
      brands,
    });
  }
};