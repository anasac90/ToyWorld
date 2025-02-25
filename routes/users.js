var express = require("express");
var router = express.Router();
const nocache = require("nocache");
const { validUser } = require("../middlewares/session");
const conditions = require("../middlewares/conditions");
const userController = require("../controllers/userController");
const addressController = require("../controllers/addressController");
const productController = require("../controllers/productController");
const categoryController = require("../controllers/categoryController");
const cartController = require("../controllers/cartController");
const orderController = require("../controllers/orderController");
const couponController = require("../controllers/couponController");
const wishListController = require("../controllers/wishListController");
const walletController = require("../controllers/walletController");
const multer = require("multer");
const passport = require("passport");
const reportGenerator = require('../controllers/report-generator');
const path = require("path");



// Use the multer instance defined in app.js
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public/images/profile");
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    },
  }),
});

router.use(express.urlencoded({ extended: false }));
router.use(nocache());

//Home page for user
router.get("/", conditions.isBlocked, userController.userHome);

router.get("/login", conditions.isBlocked, userController.login);

router.get("/forgetPassword",conditions.isBlocked, userController.forgetPassword)

// User login validation
router.post("/home", conditions.isBlocked, userController.validation);

// User signup
router.get("/signup", conditions.isBlocked, (req, res) => {
  res.render("users/user-signup", { user: [], warning: "", newUser: req.body });
});

// OTP verification page
router.post(
  "/verify",
  conditions.isBlocked,
  conditions.isPasswordMatch,
  conditions.isEmailExist,
  userController.signUp
);

// send OTP
router.post("/sendOTP", conditions.isBlocked, userController.sendOTP);

// verify OTP
router.post("/verifyOTP", conditions.isBlocked, userController.verifyOTP);

// product page
router.get("/products", conditions.isBlocked, userController.userProducts);

// detailed product page
router.get("/products/:id",conditions.isBlocked, userController.productDetailed);

// category page
router.get("/categories", conditions.isBlocked, userController.userCategories);

// list of products in a category
router.get('/categories/:id',conditions.isBlocked,categoryController.categryProducts)

// google authentication
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// google authentication verification
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "" }),
  (req, res) => {
    req.session.user = [req.user];
    res.redirect("/");
  }
);

// logout user
router.get("/logout", conditions.isBlocked, userController.logout);

// user my account page
router.get('/my-account', conditions.isBlocked,validUser,userController.userAccount);

// edit profile
router.get('/my-account/edit-profile', conditions.isBlocked,validUser,userController.editProfile);

// update profile
router.post('/my-account/update-profile', conditions.isBlocked,validUser,userController.updateProfile);

// change password page
router.get('/my-account/change-password', conditions.isBlocked,validUser,userController.changePassword)

// update password
router.post('/my-account/update-password', conditions.isBlocked,validUser,userController.updatePassword);

// verify email page
router.get('/my-account/verify-email', conditions.isBlocked,validUser,userController.verifyEmail);

// add address page
router.get('/address/add',conditions.isBlocked,validUser,addressController.addAddress);

// submit address
router.post('/address/submit',conditions.isBlocked,validUser,addressController.submitAddress);

// edit address
router.get('/address/edit/:id',conditions.isBlocked,validUser,addressController.editAddress);

// update address
router.put('/address/update',conditions.isBlocked,validUser,addressController.updateAddress);

// delete one address
router.delete('/address/delete/:id',conditions.isBlocked,validUser,addressController.deleteAddress);

// cart
router.get('/cart',conditions.isBlocked,validUser,cartController.cart);

// add to cart
router.get('/add-to-cart/:id',conditions.isBlocked,validUser,cartController.addToCart);

// update quantity
router.post('/cart/update-quantity',conditions.isBlocked,validUser,cartController.updateQuantity)

// delete from cart
router.delete('/cart/delete/:id',conditions.isBlocked,validUser,cartController.deleteFromCart);

// checkout page
router.get('/checkout',conditions.isBlocked,validUser,orderController.checkout);

// place-order
router.post('/checkout/place-order',conditions.isBlocked,validUser,orderController.placeOrder);

// razorpay order payment 
router.post('/checkout/verify-payment',conditions.isBlocked,validUser, orderController.verifyPayment);

// success payment
router.get('/order-success',conditions.isBlocked,validUser, (req,res)=>{
  res.render("users/order-status", {
    user: req.session.user,
    status: "Order Placed Successfully",
    warning: null,
  });
})

// orders
router.get('/orders',conditions.isBlocked,validUser,orderController.orders);

// order details
router.get('/orderDetails/:id',conditions.isBlocked,validUser,orderController.orderDetails)

// invoice generate
router.post('/orderDetails/generateInvoice',conditions.isBlocked, validUser,reportGenerator.generateInvoice);

// download invoice
router.get('/orderDetails/downloadInvoice/:invoice',conditions.isBlocked,validUser,(req,res)=>{
  const invoice = req.params.invoice;
  res.download(path.join(__dirname,`../downloads/invoice ${invoice}.pdf`))
})

// cancel order
router.put('/orderCancel',conditions.isBlocked,validUser,orderController.cancelOrder);

// return order
router.put('/orderReturn',conditions.isBlocked,validUser,orderController.returnOrder);

// search
router.post('/search',conditions.isBlocked,productController.search);

// sort
router.get('/sort/:id',conditions.isBlocked,productController.sort);

// sort from products page 
router.get('/products/sort/:id',conditions.isBlocked,productController.productSort);

// coupon
router.post('/couponChecking',conditions.isBlocked,validUser,couponController.couponChecking)

// category filtering on search page
router.get('/search/:searchWord/:category',conditions.isBlocked,categoryController.categoryFilter)

// category filtering on products page
router.get('/products/filter/:category',conditions.isBlocked,categoryController.productsCategoryFilter)

// wish list
router.get('/wishlist',conditions.isBlocked,validUser,(req,res)=>{
  const user_id = req.session.user[0]._id;
  
  wishListController.wishlist(req,res,user_id);
})

// add to wish list
router.post('/addToWishList',conditions.isBlocked,validUser,(req,res)=>{
  const productCode = req.body.productCode;
  const user_id = req.session.user[0]._id;

  wishListController.addToWishList(req,res,productCode,user_id);
})

router.delete('/wishlist/delete/:productCode',conditions.isBlocked,validUser,(req,res)=>{
  const {productCode} = req.params;
  const user_id = req.session.user[0]._id;

  wishListController.deleteWishlist(req,res,productCode,user_id);
})

router.get('/wallet',conditions.isBlocked,validUser,walletController.wallet);



module.exports = router;
