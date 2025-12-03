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
    products = await collection.find(search).sort({ _id: -1 }).skip(skip).limit(limit).toArray();
  } else {
    products = await collection.find(search).sort({ _id: -1 }).toArray();
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

// Delete image 
const deleteImageDB = async (productId,filePath) =>{

  fileName = filePath.replace("/images/","");
  
  try {
    const collection = getDB().collection(collections.PRODUCT_COLLECTION);
    const result = await collection.updateOne({_id: new ObjectId(productId)},{$pull:{"productImages":fileName}})
  
    return result;
  } catch (error) {
    console.log("Error: " + error);
  }
}

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

const incrementQuantity = async (productCode,quantity)=>{
  try {const collection = getDB().collection(collections.PRODUCT_COLLECTION);
  const result = await collection.updateOne({productCode:productCode},{$inc:{stockQuantity:quantity}})
  return result;}
  catch (error) {
    console.log("Error: " + error);
  }
}

const decrementQuantity = async (productCode,quantity)=>{
  try {
    const collection = getDB().collection(collections.PRODUCT_COLLECTION);
    const result = await collection.updateOne({productCode:productCode},{$inc:{stockQuantity:-quantity}})
    return result;
  } catch (error) {
    console.log("Error: " + error);
  }
}

const countActiveProducts = async () => {
  const collection = getDB().collection(collections.PRODUCT_COLLECTION);
  const count = await collection.countDocuments({isDeleted: false});
  return count;
};


module.exports = {
  insertProduct,
  getProducts,
  findProduct,
  updateProduct,
  renameCategory,
  search,
  incrementQuantity,
  decrementQuantity,
  deleteImageDB,
  countActiveProducts
};
