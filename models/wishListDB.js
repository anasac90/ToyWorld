const { getDB } = require("../configure/db-connect");
const collections = require("../configure/collections");
const { ObjectId } = require("mongodb");

const addToWishList = async (productCode, user_id) => {
    const collection = getDB().collection(collections.WISHLIST_COLLECTION);
    const result = await collection.updateOne(
        { user_id: new ObjectId(user_id) },
        {
            $push: {
                products: productCode
            }
        },
        { upsert: true });
    return result;
}

const wishlistProducts = async (user_id)=>{
    const collection = getDB().collection(collections.WISHLIST_COLLECTION);
    const result = await collection.findOne({user_id:new ObjectId(user_id)},{poduct:1,_id:0});
    return result.products;
}

const deleteWishlist = async (productCode,user_id)=>{
    const collection = getDB().collection(collections.WISHLIST_COLLECTION);
    const result = await collection.updateOne({user_id:new ObjectId(user_id)},{$pull:{products:productCode}})
    return result;
}

module.exports = {
    addToWishList,
    wishlistProducts,
    deleteWishlist,
}