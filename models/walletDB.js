const { getDB } = require('../configure/db-connect');
const collections = require('../configure/collections');
const { ObjectId, Transaction } = require("mongodb");

const getWallet = async (user_id)=>{
    const collection = getDB().collection(collections.WALLET_COLLECTION);
    const result = collection.findOne({user_id: new ObjectId(user_id)});
    return result;
}

const addToWallet = async (user_id,amount,document)=>{
    try {
        const collection = getDB().collection(collections.WALLET_COLLECTION);
        const result = await collection.updateOne(
        {user_id: new ObjectId(user_id)},
        {
        $inc:{ balanceAmount : amount },
        $push:{transactions:document}
        },
        {upsert:true})
    return result;
    } catch (error) {
        console.error('Error:',error);
    }
}

const reduceFromWallet = async (user_id,amount,document)=>{
    try {
        const collection = getDB().collection(collections.WALLET_COLLECTION);
        const result = await collection.updateOne(
        {user_id: new ObjectId(user_id)},
        {
        $inc:{ balanceAmount : -amount },
        $push:{transactions:document}
        })
    return result;
    } catch (error) {
        console.error('Error:',error);
    }
}


module.exports = {
    getWallet,
    addToWallet,
    reduceFromWallet
}