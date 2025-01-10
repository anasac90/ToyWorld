const { getDB } = require("../configure/db-connect");
const collections = require("../configure/collections");
const { ObjectId } = require("mongodb");

// add to cart
exports.addToCart = async (document, user_id) => {
  const collection = getDB().collection(collections.CART_COLLECTION);
  const result = await collection.insertOne({
    ...document,
    user_id: new ObjectId(user_id),
  });
  // Return the inserted user by fetching it using insertedId
  const insertedCart = await collection.findOne({ _id: result.insertedId });
  return insertedCart;
};

// find cart by product code
exports.findCartProductCode = async (productCode, user_id) => {
  const collection = getDB().collection(collections.CART_COLLECTION);
  const result = await collection.findOne({
    $and: [{ productCode: productCode }, { user_id: new ObjectId(user_id) }],
  });
  return result;
};

exports.findCart = async (user_id) => {
  const collection = getDB().collection(collections.CART_COLLECTION);
  const result = await collection
    .find({ user_id: new ObjectId(user_id) })
    .toArray();
  return result;
};

exports.updateQuantity = async (user_id, productCode, quantity) => {
  const collection = getDB().collection(collections.CART_COLLECTION);
  const result = await collection.updateOne(
    {
      $and: [{ productCode: productCode }, { user_id: new ObjectId(user_id) }]
    },
    { $set: { quantity: quantity } }
  );
};

exports.deleteFromCart = async (user_id, productCode) => {
  const collection = getDB().collection(collections.CART_COLLECTION);
  const result = await collection.deleteOne({
    $and: [{ productCode: productCode }, { user_id: new ObjectId(user_id) }],
  });
  return result;
};

exports.deleteCart = async (user_id)=>{
  const collection = getDB().collection(collections.CART_COLLECTION);
  const result = await collection.deleteMany({user_id: new ObjectId(user_id) });
  return result;
}