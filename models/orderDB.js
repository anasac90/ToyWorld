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
        totalCouponDiscount: { $sum: { $toDouble: '$couponDiscount' } },
        products: { $push: '$products' }
      }
    },
    {
      $unwind: '$products'
    },
    {
      $unwind: '$products'
    },
    {
      $group: {
        _id: null,
        totalOrderAmount: { $first: '$totalOrderAmount' },
        totalOfferDiscount: { $first: '$totalOfferDiscount' },
        totalCouponDiscount: { $first: '$totalCouponDiscount' },
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
      $unwind: '$products'
    },
    {
      $group: {
        _id: '$_id',
        date: { $first: '$orderDate' },
        amount: { $first: '$orderValue' },
        discount: { $first: '$discount' },
        coupon: { $first: '$couponDiscount' },
        salesCount: { $sum: '$products.quantity' }
      }
    }
  ]).toArray();
  return result;
}

exports.homeDataQuery = async (startDate) => {
  const collection = getDB().collection(collections.ORDER_COLLECTION);

  try {
    const result = await collection.aggregate([
      {
        $match: {
          orderDateAndTime: { $gte: startDate },
          orderStatus: "Successful"
        }
      },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productCode",
          totalSold: { $sum: "$products.quantity" }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "productCode",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          name: "$productDetails.productName",
          sales: "$totalSold"
        }
      },
      { $sort: { sales: -1 } },
      { $limit: 10 }
    ]).toArray();

    return result;
  } catch (error) {
     console.error('DB Error: ' + error);
  }
}

exports.getDashboardSummary = async (startDate) => {
  const collection = getDB().collection(collections.ORDER_COLLECTION);

  const result = await collection.aggregate([
    {
      $match: {
        orderDateAndTime: { $gte: startDate },
        orderStatus: "Successful",
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: { $toDouble: "$orderValue" } },
        totalOrders: { $sum: 1 }
      }
    },
    { $project: { _id: 0 } }
  ]).toArray();

  return result[0] || { totalRevenue: 0, totalOrders: 0 };
};


exports.getSalesTrend = async (startDate, filterOption) => {
  const collection = getDB().collection(collections.ORDER_COLLECTION);

  // group format depends on filter
  let format;
  if (filterOption === 'weekly' || filterOption === 'monthly') {
    // group by day
    format = "%Y-%m-%d";
  } else {
    // yearly -> group by month
    format = "%Y-%m";
  }

  const result = await collection.aggregate([
    {
      $match: {
        orderDateAndTime: { $gte: startDate },
        orderStatus: "Successful"
      }
    },
    {
      $group: {
        _id: { $dateToString: { format, date: "$orderDateAndTime" } },
        total: { $sum: { $toDouble: "$orderValue" } }
      }
    },
    { $sort: { _id: 1 } }
  ]).toArray();

  // map to { labels, data }
  const labels = result.map(r => r._id);
  const data = result.map(r => r.total);

  return { labels, data };
};


exports.homeCategoryDataQuery = async (startDate) => {
  const collection = getDB().collection(collections.ORDER_COLLECTION);

  const result = await collection.aggregate([
    {
      $match: {
        orderDateAndTime: { $gte: startDate },
        orderStatus: "Successful"
      }
    },
    { $unwind: "$products" },
    {
      $lookup: {
        from: "products",
        localField: "products.productCode",
        foreignField: "productCode",
        as: "productDetails"
      }
    },
    { $unwind: "$productDetails" },
    {
      $group: {
        _id: "$productDetails.category",
        totalSold: { $sum: "$products.quantity" }
      }
    },
    {
      $project: {
        name: "$_id",
        sales: "$totalSold",
        _id: 0
      }
    },
    { $sort: { sales: -1 } },
    { $limit: 10 }
  ]).toArray();

  return result;
};


exports.homeBrandDataQuery = async (startDate) => {
  const collection = getDB().collection(collections.ORDER_COLLECTION);

  const result = await collection.aggregate([
    {
      $match: {
        orderDateAndTime: { $gte: startDate },
        orderStatus: "Successful"
      }
    },
    { $unwind: "$products" },
    {
      $lookup: {
        from: "products",
        localField: "products.productCode",
        foreignField: "productCode",
        as: "productDetails"
      }
    },
    { $unwind: "$productDetails" },
    {
      $group: {
        _id: "$productDetails.brand",
        totalSold: { $sum: "$products.quantity" }
      }
    },
    {
      $project: {
        name: "$_id",
        sales: "$totalSold",
        _id: 0
      }
    },
    { $sort: { sales: -1 } },
    { $limit: 10 }
  ]).toArray();

  return result;
};
