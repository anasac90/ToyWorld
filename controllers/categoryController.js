const categoryDB = require("../models/categoryDB");
const productDB = require("../models/productDB");
const fs = require("fs");

// category listing page
exports.categoryList = async (req, res) => {
  let categories = await categoryDB.getCategories();

  if (req.session.categoryAssigned) {
    req.session.categoryAssigned = false;
    res.render("admin/categories", {
      categories,
      warning: "Category already assigned",
    });
  } else {
    res.render("admin/categories", { categories, warning: "" });
  }
};

let status = "";

//add category page
exports.addCategory = (req, res) => {
  if (req.session.categoryExist) {
    req.session.categoryExist = false;
    res.render("admin/add-category", {
      status,
      warning: "Category already exist",
    });
  } else {
    res.render("admin/add-category", { status: "", warning: "" });
  }
};

// submit new category details to db
exports.submitCategory = async (req, res) => {
  let categoryName = req.body.categoryName;

  let categories = await categoryDB.getCategories({
    categoryName: categoryName
  });
  if (categories.length) {
    req.session.categoryExist = true;
    fs.unlink("./" + req.file.path, (err) => {
      if (err) throw (err);
    })
    status = "";
    res.redirect("/admin/categories/add");
  } else {
    let result = await categoryDB.insertCategory(req.body, req.file);
    status = "Successfully Submitted";
    res.redirect("/admin/categories");
  }
};

// edit category page
let categoryId;
let queriedCategory;
exports.findCategory = async (req, res) => {
  categoryId = req.params.id;
  queriedCategory = await categoryDB.findCategory(categoryId);
  res.render("admin/edit-category", { queriedCategory, warning: "", status: "" });
};

let oldCategory; 
// update category
exports.updateCategory = async (req, res) => {
  oldCategory = oldCategory ? oldCategory : queriedCategory[0].categoryName;
  let newcategory = req.body.categoryName;

  let categories = await categoryDB.getCategories({
    categoryName: newcategory
  });

  console.log("**Test: " + oldCategory,newcategory);
  

  if (oldCategory != newcategory && categories.length > 0) {
    Object.assign(queriedCategory[0],req.body);
    res.render("admin/edit-category", { queriedCategory, warning: "Category already exist", status: "" });
  } else {
    await productDB.renameCategory(
      { category: oldCategory },
      { category: newcategory }
    );
    let result = await categoryDB.updateCategory(categoryId, req.body, req.file);
    res.redirect("/admin/categories");
  }
};

// soft delete
exports.deleteCategory = async (req, res) => {
  categoryId = req.params.id;
  let categoryDoc = await categoryDB.findCategory(categoryId);
  let category = categoryDoc[0].categoryName;
  let productList = await productDB.getProducts({ category: category });
  if (productList.length > 0) {
    req.session.categoryAssigned = true;
    res.redirect("/admin/categories");
  } else {
    await categoryDB.updateCategory(
      categoryId,
      { isDeleted: true },
      (req.file = [])
    );
    res.redirect("/admin/categories");
  }
};

// unDelete
exports.unDeleteCategory = async (req, res) => {
  categoryId = req.params.id;
  await categoryDB.updateCategory(
    categoryId,
    { isDeleted: false },
    (req.file = [])
  );
  res.redirect("/admin/categories");
};

// list products in a category
exports.categryProducts = async (req, res) => {
  let categoryName = req.params.id;

  let products = await productDB.getProducts({ category: categoryName });
  let user = req.session.user ? req.session.user : [];

  res.render("users/category-products", { products, categoryName, user: user });
};

// filter searched product based on category
exports.categoryFilter = async (req, res) => {
  const { searchWord, category } = req.params;

  let searchedProducts = await productDB.search(searchWord)
  let categories = await categoryDB.getCategories();

  let filteredProducts = [];
  let i = 0;
  searchedProducts.forEach((product) => {
    if (product.category === category) {
      filteredProducts[i] = product;
      i++;
    }
  });
  res.render("users/searchpage-filter", {
    user: req.session.user ? req.session.user : [],
    products: filteredProducts,
    categories,
    searchQuery: searchWord,
  });
};

// filter category in products page
exports.productsCategoryFilter = async (req, res) => {
  let page = parseInt(req.query.page) || 1;
  let limit = 5; // Product count in each page
  let skip = (page - 1) * limit;

  const { category } = req.params;

  let products = await productDB.getProducts();
  let categories = await categoryDB.getCategories();

  let filteredProducts = [];
  let i = 0;
  products.forEach((product) => {
    if (product.category === category) {
      filteredProducts[i] = product;
      i++;
    }
  });

  // Get total product count
  let totalProducts = filteredProducts.length;

  let totalPages = Math.ceil(totalProducts / limit);

  res.render("users/products", {
    user: req.session.user ? req.session.user : [],
    products: filteredProducts,
    categories,
    sortOption: null,
    categoryOption: category,
    currentPage: page,
    totalPages
  });
};