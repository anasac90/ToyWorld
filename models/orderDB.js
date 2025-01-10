const { getDB } = require("../configure/db-connect");
const collections = require("../configure/collections");
const { ObjectId } = require("mongodb");
const { cancellation } = require("../controllers/orderController");

exports.insertOrder = async (orderData, user_id) => {
  const collection = getDB().collection(collections.ORDER_COLLECTION);
  let document = { ...orderData, ...{ user_id: new ObjectId(user_id) } };
  const result = await collection.insertOne(document);
  return result;
};

exports.userOrders = async (user_id) => {
  const collection = getDB().collection(collections.ORDER_COLLECTION);
  const result = await collection
    .find({ user_id: new ObjectId(user_id) })
    .toArray();
  return result;
};

exports.findOrder = async (order_id) => {
  const collection = getDB().collection(collections.ORDER_COLLECTION);
  const result = await collection.findOne({ _id: new ObjectId(order_id) });
  return result;
};

exports.cancelOrder = async (order_id, productCode) => {
  const collection = getDB().collection(collections.ORDER_COLLECTION);
  const result = await collection.updateOne(
    { _id: new ObjectId(order_id), "products.productCode": productCode },
    { $set: { "products.$.cancelStatus": "requested" } }
  );
  return result;
};

exports.returnOrder = async (order_id, productCode) => {
  const collection = getDB().collection(collections.ORDER_COLLECTION);
  const result = await collection.updateOne(
    { _id: new ObjectId(order_id), "products.productCode": productCode },
    { $set: { "products.$.returnStatus": "requested" } }
  );
  return result;
};

exports.getOrders = async (search) => {
  try {
    const collection = getDB().collection(collections.ORDER_COLLECTION);
    const result = collection.find(search).toArray();
    return result;


  } catch (error) {
    console.error('DB Error: ' + error);
  }

};

exports.updateStatus = async (order_id, productCode, newStatus) => {
  try {
    const collection = getDB().collection(collections.ORDER_COLLECTION);
    const result = await collection.updateOne(
      { _id: new ObjectId(order_id), "products.productCode": productCode },
      { $set: { "products.$.status": newStatus } }
    );
    return result;
  } catch {
    console.log("Error");
  }
};

exports.updateCancellation = async (order_id, productCode, cancellation) => {
  const collection = getDB().collection(collections.ORDER_COLLECTION);
  const result = await collection.updateOne(
    { _id: new ObjectId(order_id), "products.productCode": productCode },
    { $set: { "products.$.cancelStatus": cancellation } }
  );
  return result;
}

exports.updateReturn = async (order_id, productCode, returnStatus) => {
  const collection = getDB().collection(collections.ORDER_COLLECTION);
  const result = await collection.updateOne(
    { _id: new ObjectId(order_id), "products.productCode": productCode },
    { $set: { "products.$.returnStatus": returnStatus } }
  );
  return result;
}

exports.getOverallReport = async (startDate, endDate) => {
  const collection = getDB().collection(collections.ORDER_COLLECTION);
  const result = await collection.aggregate([
    {
      $match: {
        $and: [
          { orderDateAndTime: { $gte: startDate } },
          { orderDateAndTime: { $lte: endDate } }
        ]
      }
    },
    {
      $group: {
        _id: null,
        totalOrderAmount: { $sum: { $toDouble: '$orderValue' } },
        totalOfferDiscount: { $sum: { $toDouble: '$discount' } },
        totalCouponDiscount:{$sum: { $toDouble:'$couponDiscount'}},
        products: {$push:'$products'}
      }
    },
    {
      $unwind: '$products'
    },
    {
      $unwind: '$products'
    },
    {
      $group:{
        _id:null,
        totalOrderAmount:{$first:'$totalOrderAmount'},
        totalOfferDiscount:{$first:'$totalOfferDiscount'},
        totalCouponDiscount:{$first:'$totalCouponDiscount'},
        totalSales: { $sum: '$products.quantity' },
      }
    },
    {
      $project: { _id: 0 }
    }
  ]).toArray();
  return result;
}

exports.getIndividualReport = async (startDate, endDate) => {
  const collection = getDB().collection(collections.ORDER_COLLECTION);
  const result = await collection.aggregate([
    {
      $match: { $and: [{ orderDateAndTime: { $gte: startDate } }, { orderDateAndTime: { $lte: endDate } }] }
    },
    {
      $unwind:'$products'
    },
    {
      $group: {
        _id: '$_id',
        date:{$first:'$orderDate'},
        amount:{$first:'$orderValue'},
        discount:{$first:'$discount'},
        coupon:{$first:'$couponDiscount'},
        salesCount:{$sum:'$products.quantity'}
      }
    }
  ]).toArray();
  return result;
}