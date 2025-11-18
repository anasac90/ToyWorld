const productDB = require("../models/productDB");
const { getCategories } = require("../models/categoryDB");
const fs = require("fs");
const path = require("path");

// admin product listing page
exports.productList = async (req, res) => {
  let currentPage = parseInt(req.query.page) || 1;
  let limit = 6;
  let skip = (currentPage - 1) * limit;

  let products = await productDB.getProducts();
  let totalProductCount = products.length;
  let totalPages = Math.ceil(totalProductCount / limit);

  products = await productDB.getProducts({},skip,limit);

  
  res.render("admin/products", { products, totalPages, currentPage });
};

//add product page
let status = "";
let categories = [];
let brands = ["brand1", "brand2", "brand3"];
exports.addProduct = async (req, res) => {
  status = "";
  let categoriesDocs = await getCategories();
  categories = categoriesDocs.map((data) => data.categoryName);
  res.render("admin/add-product", {
    status,
    productData: "",
    productImage: "",
    warning: "",
    categories,
    brands,
  });
};

// submit new product details to db
exports.submitProduct = async (req, res) => {
  req.body.price = Number(req.body.price);
  req.body.stockQuantity = Number(req.body.stockQuantity);
  req.body.minimumAge = Number(req.body.minimumAge);

  let result = await productDB.insertProduct(req.body, req.files);
  status = "Successfully Submitted";
  res.redirect("/admin/products");
};

// edit product
let productId;
exports.findProduct = async (req, res) => {
  productId = req.params.id;
  let warning = "";
  let queriedProduct = await productDB.findProduct(productId);
  let categoriesDocs = await getCategories();
  categories = categoriesDocs.map((data) => data.categoryName);
  res.render("admin/edit-product", { queriedProduct, categories, brands, warning });
};

// update product
exports.updateProduct = async (req, res) => {
  let result = await productDB.updateProduct(productId, req.body, req.files);
  res.redirect("/admin/products");
};

// soft delete or unlist
exports.deleteProduct = async (req, res) => {
  productId = req.params.id;
  await productDB.updateProduct(
    productId,
    { isDeleted: true },
    (req.files = [])
  );
  res.redirect("/admin/products");
};

// cancel the soft delete or list
exports.unDeleteProduct = async (req, res) => {
  productId = req.params.id;
  await productDB.updateProduct(
    productId,
    { isDeleted: false },
    (req.files = [])
  );
  res.redirect("/admin/products");
};

// to delete product image
exports.deleteImage = async (req,res)=>{
  let fileName = req.body.fileName;
  let productId =req.body.productId;

  let result = await productDB.findProduct(productId);

  if(result.length > 0){
    await productDB.deleteImageDB(productId,fileName)
  }

  
  fs.unlink(path.join("./public",fileName),err=>{
    if(err) {
      res.json({success:false, message:err})
    } else res.json({success:true});
  })
}

// search product
let searchedProducts;
let searchQuery;
exports.search = async (req, res) => {
  searchQuery = req.body.search.trim();

  let categories = await getCategories();

  searchedProducts = await productDB.search(searchQuery);
  res.render("users/searchpage", {
    user: req.session.user ? req.session.user : [],
    products: searchedProducts,
    categories,
    sortOption:null,
    searchQuery:''?null:searchQuery,
  });
};

// sorting
exports.sort = async (req, res) => {
  let categories = await getCategories();
  const sortOption = req.params.id;

  switch (sortOption) {
    case "popularity":
      searchedProducts.sort((a, b) => a.price - b.price);
      break;

    case "priceLtoH":
      searchedProducts.sort((a, b) => a.price - b.price);
      break;

    case "priceHtoL":
      searchedProducts.sort((a, b) => b.price - a.price);
      break;

    case "ratings":
      searchedProducts.sort((a, b) => a.price - b.price);
      break;

    case "featured":
      searchedProducts.sort((a, b) => a.price - b.price);
      break;

    case "newArrivals":
      searchedProducts.sort((a, b) => a.price - b.price);
      break;

    case "alphaAtoZ":
      searchedProducts.sort((a, b) =>
        a.productName.localeCompare(b.productName)
      );
      break;

    case "alphaZtoA":
      searchedProducts.sort((a, b) =>
        b.productName.localeCompare(a.productName)
      );
      break;
  }

  res.render("users/searchpage", {
    user: req.session.user ? req.session.user : [],
    products: searchedProducts,
    categories,
    sortOption,
    searchQuery,
  });
};

// sorting from products page
exports.productSort = async (req,res)=>{
  
  let page = parseInt(req.query.page) || 1;
  let limit = 5; // Product count in each page
  let skip = (page - 1) * limit;

  let categories = await getCategories();
  let products = await productDB.getProducts({ isDeleted: false });

  let totalProducts = products.length;
  let totalPages = Math.ceil(totalProducts / limit);

  const sortOption = req.params.id;

  switch (sortOption) {
    case "popularity":
      products.sort((a, b) => a.price - b.price);
      break;

    case "priceLtoH":
      products.sort((a, b) => a.price - b.price);
      break;

    case "priceHtoL":
      products.sort((a, b) => b.price - a.price);
      break;

    case "ratings":
      products.sort((a, b) => a.price - b.price);
      break;

    case "featured":
      products.sort((a, b) => a.price - b.price);
      break;

    case "newArrivals":
      products.sort((a, b) => a.price - b.price);
      break;

    case "alphaAtoZ":
      products.sort((a, b) =>
        a.productName.localeCompare(b.productName)
      );
      break;

    case "alphaZtoA":
      products.sort((a, b) =>
        b.productName.localeCompare(a.productName)
      );
      break;
  }

  products = products.splice(skip,limit);
  
  res.render("users/products", {
    user: req.session.user ? req.session.user : [],
    products,
    categories,
    sortOption,
    categoryOption:null,
    currentPage: page,
    totalPages
  });
}