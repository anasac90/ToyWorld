var express = require("express");
var router = express.Router();
const nocache = require("nocache");
const session = require("express-session");
const path = require("path");
const { validAdmin } = require("../middlewares/session");
const conditions = require("../middlewares/conditions");
const productController = require("../controllers/productController");
const categoryController = require("../controllers/categoryController");
const userController = require("../controllers/userController");
const orderController = require("../controllers/orderController");
const offerController = require("../controllers/offerController");
const couponController = require('../controllers/couponController');
const reportGenerator = require('../controllers/report-generator');
const multer = require("multer");
const bcrypt = require("bcrypt");

// Use the multer instance defined in app.js
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public/images");
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    },
  }),
});


router.use(express.urlencoded({ extended: false }));
router.use(nocache());
// router.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//   })
// );

// Admin login
router.get("/", (req, res) => {
  if (req.session.admin) {
    res.redirect("/admin/home");
  } else {
    if (req.session.wrongAdmin) {
      req.session.wrongAdmin = false;
      res.render("admin/admin-login", { message: "Invalid Credential" });
    } else {
      res.render("admin/admin-login", { message: "" });
    }
  }
});

// Admin authentication
router.post("/home", async (req, res) => {
  const passwordCheck = await bcrypt.compare(req.body.password, '$2b$10$yU/WPcSunskn.E.Fvcni2uPSqqjK9CWlK2pX0HMoOosXOJ/N9qpqq');
  if (req.body.username == "admin" && passwordCheck) {
    req.session.admin = req.body.username;
    res.redirect("/admin/home");
  } else {
    req.session.wrongAdmin = true;
    res.redirect("/admin");
  }
});

//admin homepage
router.get("/home", validAdmin, reportGenerator.bestSellingProducts);

//admin homepage filter
router.get('/home/:filter', validAdmin, reportGenerator.bestSellingProducts);

// admin product listing page
router.get("/products", validAdmin, productController.productList);

//add product page
router.get("/products/add", validAdmin, productController.addProduct);

// adding new product details to db
router.post(
  "/products/submit",
  validAdmin,
  upload.array("productImages", 5),
  conditions.validProduct,
  productController.submitProduct
);

// edit product
router.get("/products/edit/:id", validAdmin, productController.findProduct);

// update product
router.post(
  "/products/update",
  validAdmin,
  upload.array("productImages", 5),
  productController.updateProduct
);

// delete a product
router.get("/products/delete/:id", validAdmin, productController.deleteProduct);

// undelete a product
router.get("/products/undelete/:id", validAdmin, productController.unDeleteProduct);

// category listing page
router.get("/categories", validAdmin, categoryController.categoryList);

//add category page
router.get("/categories/add", validAdmin, categoryController.addCategory);

// adding new category details to db
router.post(
  "/categories/submit",
  validAdmin,
  upload.single("categoryImage"),
  categoryController.submitCategory
);

// edit category page
router.get("/categories/edit/:id", validAdmin, categoryController.findCategory);

// update category
router.post(
  "/categories/update",
  validAdmin,
  upload.single("categoryImage"),
  categoryController.updateCategory
);

// delete a category
router.get("/categories/delete/:id", validAdmin, categoryController.deleteCategory);

// undelete a category
router.get("/categories/undelete/:id", validAdmin, categoryController.unDeleteCategory);

//user management page
router.get("/users", validAdmin, userController.userManagement);

// block user
router.get('/users/block/:id', validAdmin, userController.blockUser);

// unblock user
router.get('/users/unblock/:id', validAdmin, userController.unBlockUser);

// order management page
router.get('/orders', validAdmin, orderController.getOrders);

// order status update
router.put('/orders/status/:order_id/:productCode/:newStatus', validAdmin, orderController.updateStatus)

// order cancellation update
router.put('/orders/cancellation/:order_id/:productCode/:cancellation', validAdmin, orderController.cancellation)

// return order updata
router.put('/orders/return/:order_id/:productCode/:returnStatus', validAdmin, orderController.returnUpdate)

//brands management page
router.get("/brands", validAdmin, (req, res) => {
  res.render("admin/brands");
});

//coupon management page
router.get("/coupons", validAdmin, (req, res) => {
  couponController.coupons(req, res);
});

// add new coupon page
router.get('/coupons/add', validAdmin, couponController.addCouponPage)

// submit new coupon 
router.post('/coupons/submit', validAdmin, couponController.addNewCoupon)

// edit coupon page
router.get('/coupons/edit/:id', validAdmin, couponController.editCouponPage)

// update coupon page
router.put('/coupons/update', validAdmin, couponController.updateCoupon)

// delete coupon
router.delete('/coupons/delete/:id', validAdmin, couponController.deleteCoupon)

//offer management page
router.get("/offers", validAdmin, (req, res) => {
  offerController.offersManagement(req, res);
});

//offer management page to a specific tab
router.get("/offers/:activeTab", validAdmin, (req, res) => {
  offerController.offersManagementTab(req, res);
});

// add new product offer
router.post('/productOffer/add', validAdmin, offerController.addProductOffer);

// add new category offer
router.post('/categoryOffer/add', validAdmin, offerController.addCategoryOffer);

// add new referral offer
router.post('/referralOffer/add', validAdmin, offerController.addReferralOffer);

// edit product offer
router.get('/productOffer/edit/:id', validAdmin, (req, res) => {
  const offerID = req.params.id;
  offerController.editProductOffer(req, res, offerID);
})

// edit category offer
router.get('/categoryOffer/edit/:id', validAdmin, (req, res) => {
  const offerID = req.params.id;
  offerController.editCategoryOffer(req, res, offerID);
})

// update product/category/referral offer
router.put('/offer/update/:id', validAdmin, (req, res) => {
  const offerID = req.params.id;
  offerController.updateOffer(req, res, offerID);
})

// delete offer
router.delete('/deleteOffer/', validAdmin, (req, res) => {
  const offerID = req.body.offerID;
  const offerType = req.body.offerType;

  offerController.deleteOffer(req, res, offerID, offerType);
})

// sales report page
router.get("/report", validAdmin, (req, res) => {
  res.render("admin/sales-report");
});

// generate report
router.post('/report/generate', validAdmin, orderController.generateReport);

// generate pdf file
router.post('/report/generatePdf', validAdmin, reportGenerator.generatePdf);

// download pdf
router.get('/reprt/downloadPdf', validAdmin, (req, res) => {
  pdfPath = path.join(__dirname, '../downloads/sales-report.pdf')
  res.download(pdfPath);
})

// generate excel file
router.post('/report/generateExcel', validAdmin, reportGenerator.generateExcel)

// download excel
router.get('/reprt/downloadExcel', validAdmin, (req, res) => {
  excelPath = path.join(__dirname, '../downloads/sales-report.xlsx')
  res.download(excelPath);
})

// admin logout
router.get("/logout", (req, res) => {
  req.session.admin = null;
  res.render("admin/admin-login", { message: "Logout Successful" });
});

module.exports = router;
