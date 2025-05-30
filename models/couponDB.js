const { getDB } = require("../configure/db-connect");
const collections = require("../configure/collections");
const { ObjectId } = require("mongodb");

const getCoupons = async (search)=>{
    try {const collection = getDB().collection(collections.COUPON_COLLECTION);
    if(search?._id){
        let result = await collection.find({_id:new ObjectId(search._id)}).toArray();
        return result;
    } else {
        let result = await collection.find(search).toArray();
        return result;
    }}
    catch(error){
        console.log(error); 
    }
}

const addNewCoupon = async (document)=>{
    const collection = getDB().collection(collections.COUPON_COLLECTION);
    const result = await collection.insertOne(document);
    return result;
}

const updateCoupon = async (couponID,document)=>{
    const collection = getDB().collection(collections.COUPON_COLLECTION);
    const result = await collection.updateOne({_id:new ObjectId(couponID)},{$set:document});
    return result;
}

const deleteCoupon = async (couponID)=>{
    const collection = getDB().collection(collections.COUPON_COLLECTION);
    const result = await collection.deleteOne({_id:new ObjectId(couponID)});
    return result;
}


module.exports = {
    getCoupons,
    addNewCoupon,
    updateCoupon,
    deleteCoupon,
}