const { getDB } = require("../configure/db-connect");
const collections = require("../configure/collections");
const { ObjectId } = require("mongodb");

// Function to insert a address
exports.insertAddress = async (document, user_id) => {
  const collection = getDB().collection(collections.ADDRESS_COLLECTION);
  const result = await collection.insertOne({
    ...document,
    user_id: new ObjectId(user_id),
  });
  // Return the inserted user by fetching it using insertedId
  const insertedAddress = await collection.findOne({ _id: result.insertedId });
  return insertedAddress;
};

// Function to query addresses of a user
exports.findUserAddress = async (user_id) => {
  const collection = getDB().collection(collections.ADDRESS_COLLECTION);
  const document = await collection
    .find({ user_id: new ObjectId(user_id) })
    .toArray();
  return document;
};

// Function to query an address
exports.findAddress = async (addressId) => {
  const collection = getDB().collection(collections.ADDRESS_COLLECTION);
  const document = await collection
    .find({ _id: new ObjectId(addressId) })
    .toArray();
  return document;
};

// Function to update address
exports.updateAddress = async (addressId, newData) => {
  try {
    const collection = getDB().collection(collections.ADDRESS_COLLECTION);
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(addressId) },
      { $set: newData },
      { returnDocument: "after" }
    );
    return result;
  } catch (error) {
    console.error('Error updating address:', error);
  }
};

// Function to delete an address
exports.deleteAddress = async (addressId)=>{
    try {
        const collection = getDB().collection(collections.ADDRESS_COLLECTION);
        const result = await collection.deleteOne({_id:new ObjectId(addressId)});
        return result;
    } catch (error) {
        console.error('Error deleting address:', error);
    }
}
