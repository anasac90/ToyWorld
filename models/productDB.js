const { getDB } = require("../configure/db-connect");
const collections = require("../configure/collections");
const { ObjectId } = require("mongodb");

// Function to insert a product
const insertProduct = async (document, files) => {
  const newProduct = {
    ...document,
    isDeleted: false,
    productImages: files.map((file) => file.filename),
  };
  const collection = getDB().collection(collections.PRODUCT_COLLECTION);
  const result = await collection.insertOne(newProduct);
  return result;
};

// Function to get products
const getProducts = async (search, skip, limit) => {

  const collection = getDB().collection(collections.PRODUCT_COLLECTION);
  let products = [];

  if (limit) {
    products = await collection.find(search).skip(skip).limit(limit).toArray();
  } else {
    products = await collection.find(search).toArray();
  }
  
  return products;
};

// Function to query document using Id
const findProduct = async (productId) => {
  const collection = getDB().collection(collections.PRODUCT_COLLECTION);
  const document = await collection
    .find({ _id: new ObjectId(productId) })
    .toArray();
  return document;
};

// Function to update product
const updateProduct = async (productId, document, files) => {
  let updatedProduct;
  if (files.length != 0) {
    updatedProduct = {
      ...document,
      productImages: files.map((file) => file.filename),
    };
  } else {
    updatedProduct = document;
  }
  const collection = getDB().collection(collections.PRODUCT_COLLECTION);
  const result = await collection.updateOne(
    { _id: new ObjectId(productId) },
    { $set: updatedProduct }
  );
  return result;
};

const renameCategory = async (oldCategory, newCategory) => {
  const collection = getDB().collection(collections.PRODUCT_COLLECTION);
  const result = await collection.updateMany(oldCategory, {
    $set: newCategory,
  });
};

const search = async (searchQuery) => {
  const collection = getDB().collection(collections.PRODUCT_COLLECTION);
  const result = collection.find({
    productName: { $regex: searchQuery, $options: "i" }
  }).toArray();
  return result;
};

module.exports = {
  insertProduct,
  getProducts,
  findProduct,
  updateProduct,
  renameCategory,
  search,
};
