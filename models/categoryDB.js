const { getDB } = require("../configure/db-connect");
const collections = require("../configure/collections");
const { ObjectId } = require("mongodb");

// Function to insert a category
const insertCategory = async (document, file) => {
  const newCatogory = {
    ...document,
    isDeleted: false,
    categoryImage: file.filename,
  };
  const collection = getDB().collection(collections.CATEGORY_COLLECTION);
  const result = await collection.insertOne(newCatogory);
  return result;
};

// Function to get categoies
const getCategories = async (search,skip,limit) => {
  const collection = getDB().collection(collections.CATEGORY_COLLECTION);
  let categories;
  
  if(!limit){
    categories = await collection.find(search).toArray();
    
  } else {
    categories = await collection.find(search).skip(skip).limit(limit).toArray();
  }
  
  return categories;
};

// Function to query a category
const findCategory = async (categoryId) => {
  const collection = getDB().collection(collections.CATEGORY_COLLECTION);
  const document = await collection
    .find({ _id: new ObjectId(categoryId) })
    .toArray();
  return document;
};

// Function to update product
const updateCategory = async (categoryId, document, file) => {
  let updatedCategory;
  if (file && file.length != 0) {
    updatedCategory = {
      ...document,
      categoryImage: file.filename,
    };
  } else {
    updatedCategory = document;
  }
  const collection = getDB().collection(collections.CATEGORY_COLLECTION);
  const result = await collection.updateOne(
    { _id: new ObjectId(categoryId) },
    { $set: updatedCategory }
  );
  return result;
};

module.exports = {
  insertCategory,
  getCategories,
  findCategory,
  updateCategory,
};
