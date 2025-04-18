const { getDB } = require("../configure/db-connect");
const collections = require("../configure/collections");
const { ObjectId } = require("mongodb");

// Function to insert a user
exports.insertUser = async (document) => {
  const newUser = {
    ...document,
    isBlocked: false,
  };
  const collection = getDB().collection(collections.USER_COLLECTION);
  const result = await collection.insertOne(newUser);
  // Return the inserted user by fetching it using insertedId
  const insertedUser = await collection.findOne({ _id: result.insertedId });
  return insertedUser;
};

// Function to query document
exports.findUser = async (query,skip,limit) => {
  const collection = getDB().collection(collections.USER_COLLECTION);
  let document;

  if(!limit){
    document = await collection.find(query).toArray();
  } else {
    document = await collection.find(query).skip(skip).limit(limit).toArray();
  }
  
  return document;
};

// Function to update user
exports.updateUser = async (email, newData) => {
  const collection = getDB().collection(collections.USER_COLLECTION);

  let result;
  if(email.forgetPassword){
    result = await collection.findOneAndUpdate({email:email.email}, { $set: newData },{ returnDocument: 'after' });
  } else {
    result = await collection.findOneAndUpdate(email, { $set: newData },{ returnDocument: 'after' });
  }
  
  return result;
};

exports.deleteField = async (email, toDelete) => {
  const collection = getDB().collection(collections.USER_COLLECTION);
  const document = await collection.updateOne(email, { $unset: toDelete });
  return document;
};

exports.findUserById = async (id) => {
  const collection = getDB().collection(collections.USER_COLLECTION);
  const document = await collection.find({ _id: new ObjectId(id) }).toArray();
  return document;
};
