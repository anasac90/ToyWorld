const { getDB } = require('../configure/db-connect');
const collections = require('../configure/collections');
const { ObjectId } = require("mongodb");

const addOffer = async (offerData) => {
    try {
        const collection = getDB().collection(collections.OFFER_COLLECTION);
        await collection.insertOne(offerData);
        const result = await collection.find({ offerType: 'product' }).toArray();
        return result;
    } catch (error) {
        console.error('Error adding offer:', error);
        throw new Error('Database operation failed');
    }
}

const findOffer = async (search)=>{
    if(search._id){
        search = new ObjectId(search._id);
    }
    const collection = getDB().collection(collections.OFFER_COLLECTION);
    const result = collection.find(search).toArray();
    return result;
}

const updateOffer = async (newOfferData, offerID)=>{
    const collection = getDB().collection(collections.OFFER_COLLECTION);
    const result = collection.updateOne({_id: new ObjectId(offerID)},{$set:{...newOfferData}});
}

const deleteOffer = async (offerID)=>{
    const collection = getDB().collection(collections.OFFER_COLLECTION);
    const result = collection.deleteOne({_id:new ObjectId(offerID)});
    return result;
}

module.exports = {
    addOffer,
    findOffer,
    updateOffer,
    deleteOffer,
}