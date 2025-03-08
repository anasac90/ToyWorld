const orderDB = require("../models/orderDB");
const cartDB = require("../models/cartDB");
const productDB = require("../models/productDB");
const walletDB = require('../models/walletDB');
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.checkout = async (req, res) => {
  const user_id = req.session.user[0]._id;
  const cart = await cartDB.findCart(user_id);
  const wallet = await walletDB.getWallet(user_id);

  req.session.cart = cart;
  let cartProducts = await Promise.all(
    cart.map(async (element) => {
      let productCode = element.productCode;
      let quantity = element.quantity;
      let result = await productDB.getProducts({ productCode: productCode });
      result[0].quantity = quantity; // adding quantity to the result
      return result[0];
    })
  );

  let totalValue = 0;
  cartProducts.map((product) => {
    totalValue =
      totalValue + parseFloat(product.price) * parseInt(product.quantity);
  });

  const deliveryCharge = totalValue >= 1000 ? 0.0 : 100.0;
  const discount =
    totalValue >= 4000 ? Math.min(1000, (totalValue * 10) / 100) : 0.0;

  let warning;
  if (req.session.checkoutWarning) {
    warning = req.session.checkoutWarning;
    req.session.checkoutWarning = null;
  } else {
    warning = null;
  }

  res.render("users/checkout", {
    user: req.session.user,
    addresses: req.session.addresses ? req.session.addresses : [],
    cartProducts: cartProducts ? cartProducts : [],
    wallet,
    totalValue,
    deliveryCharge,
    discount,
    warning,
  });
};

let document; // to access order data to different payment methods
exports.placeOrder = async (req, res) => {
  if (!req.body.paymentMethod) {
    req.session.checkoutWarning = "Please select payment method";

    res.redirect("/checkout");
  } else if (!req.body.selectedAddress) {
    req.session.checkoutWarning = "Please select address";

    res.redirect("/checkout");
  } else {
    let cart_id = req.session.cart.map((value) => value._id);
    let products = req.session.cart.map((value) => {
      let product = {
        productCode: value.productCode,
        quantity: value.quantity,
        status: "Order placed",
      };
      return product;
    });
    let today = new Date();

    const orderDate = `${String(today.getDate()).padStart(2, "0")}/${String(
      today.getMonth() + 1
    ).padStart(2, "0")}/${today.getFullYear()}`;

    const orderTime = `${String(today.getHours()).padStart(2, "0")}:${String(
      today.getMinutes()
    ).padStart(2, "0")}:${String(today.getSeconds()).padStart(2, "0")}`;

    let user_id = req.session.user[0]._id;
    let totalAmount = parseFloat(req.body.total) * 100; //convert rupees to paisa
    let receipt = `tw_${Math.floor(Math.random() * 100000)}` //generate a receipt number

    document = {
      cart_id: cart_id,
      products: products,
      orderDate: orderDate,
      orderTime: orderTime,
      orderDateAndTime: today,
      productPrice: req.body.productPrice,
      deliveryCharge: req.body.deliveryCharge,
      discount: req.body.discount,
      orderValue: req.body.total,
      paymentMethod: req.body.paymentMethod,
      address_id: req.body.selectedAddress,
      paymentStatus: "Pending",
      orderStatus: "Successful",
      receipt: receipt,
      offer_id: null,
      coupon_id: null,
    };

    if (req.body.paymentMethod === "COD") {
      const result = await orderDB.insertOrder(document, user_id);
      await cartDB.deleteCart(req.session.user[0]._id);

      res.render("users/order-status", {
        user: req.session.user,
        status: "Order Placed Successfully",
        warning: null,
      });
    } else if (req.body.paymentMethod === "razorPay") {

      // create razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: totalAmount,
        currency: "INR",
        receipt: receipt,
        notes: { user_id: user_id },
      });

      // save the razorpay order id
      document.razorpayOrderId = razorpayOrder.id;

      // req.session.orderData = document; // save the order details to session temporary

      // render the razorpay payment page
      res.render("users/razorpay-checkout", {
        user: req.session.user,
        razorpayOrderId: razorpayOrder.id,
        totalAmount: req.body.total,
        razorpayKey: process.env.RAZORPAY_KEY_ID,
      });
    } else if (req.body.paymentMethod === "wallet") {
      document.paymentStatus = 'Paid';
      const result = await orderDB.insertOrder(document, user_id);
      const productCodes = document.products.map(product => {
        return product.productCode
      });
      const products = await Promise.all(
        productCodes.map(async productCode => {
          const [product] = await productDB.getProducts({ productCode: productCode });
          return product.productName;
        })
      )
      await cartDB.deleteCart(req.session.user[0]._id);

      const walletDocument = {
        order_id: result.insertedId,
        productCode: productCodes,
        amount: document.orderValue,
        date: today,
        type: 'Purchase',
        product: products
      }
      await walletDB.reduceFromWallet(user_id, document.orderValue, walletDocument);

      res.render("users/order-status", {
        user: req.session.user,
        status: "Order Placed Successfully",
        warning: null,
      });
    }
  }
};

exports.verifyPayment = async (req, res) => {
  const crypto = require("crypto");

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if (generated_signature === razorpay_signature) {
    const user_id = req.session.user[0]._id;
    const orderData = document;
    orderData.paymentStatus = "Paid";

    // Insert order to DB
    await orderDB.insertOrder(orderData, user_id);
    await cartDB.deleteCart(user_id);

    res.json({ status: "success" });
  } else {
    res.json({ status: "failure" });
  }
}

exports.orders = async (req, res) => {
  req.session.orders = await orderDB.userOrders(req.session.user[0]._id);

  res.render("users/my-account", {
    user: req.session.user,
    addresses: req.session.addresses ? req.session.addresses.reverse() : [],
    orders: req.session.orders ? req.session.orders.reverse() : [],
    status: null,
    warning: null,
    redirectTo: "order",
  });
};

exports.orderDetails = async (req, res) => {
  try {
    const order_id = req.params.id;
    const orderData = await orderDB.findOrder(order_id);
    const products = await Promise.all(
      orderData.products.map(async (product) => {
        const [result] = await productDB.getProducts({
          productCode: product.productCode,
        });
        return result;
      })
    );
    const productDeliveryStatus = orderData.products.map((product) => {
      if (product.status === "Order placed") {
        return 20;
      } else if (product.status === "Packed") {
        return 40;
      } else if (product.status === "Shipped") {
        return 60;
      } else if (product.status === "Out for delivery") {
        return 80;
      } else if (product.status === "Delivered") {
        return 100;
      }
    });

    const productReturnStatus = orderData.products.map((product) => {
      if (product?.returnStatus === "approved") {
        return 25;
      } else if (product?.returnStatus === "picked-up") {
        return 50;
      } else if (product?.returnStatus === "return-received") {
        return 75;
      } else if (product?.returnStatus === "refunded") {
        return 100;
      }
    });

    const cancelStatus = orderData.products.map((product) => {
      if (product.cancelStatus) {
        return product.cancelStatus;
      } else {
        return null;
      }
    });

    const returnStatus = orderData.products.map((product) => {
      if (product.returnStatus) {
        return product.returnStatus;
      } else {
        return null;
      }
    });

    res.render("users/order-details.ejs", {
      user: req.session.user,
      orderData,
      products,
      productDeliveryStatus,
      productReturnStatus,
      cancelStatus,
      returnStatus
    });
  } catch {
    console.error("Error fetching order details:", error);
    res.status(500).send("Server Error");
  }
};

exports.cancelOrder = async (req, res) => {
  const productCode = req.query.productCode;
  const orderId = req.query.orderId;

  try {
    const result = await orderDB.cancelOrder(orderId, productCode);

    res.status(200).json({ message: "Order cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error cancelling the order" });
  }
};

exports.returnOrder = async (req, res) => {
  const productCode = req.query.productCode;
  const orderId = req.query.orderId;

  try {
    const result = await orderDB.returnOrder(orderId, productCode);

    res.status(200).json({ message: "Order return requested successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error returning the order" });
  }
}

exports.getOrders = async (req, res) => {
  let currentPage = parseInt(req.query.page) || 1;
  let limit = 6;
  let skip = (currentPage - 1) * limit;

  const allOrders = await orderDB.getOrders();

  try {

    let allProducts = allOrders.flatMap(order => {
      return order.products.map(product => ({
        orderId: order._id,
        productCode: product.productCode,
      }))
    })

    let totalOrders = allProducts.length;
    let totalPages = Math.ceil(totalOrders / limit);

    let paginatedProduct = allProducts.slice(skip, skip + limit);

    const products = await Promise.all(
      paginatedProduct.map(async (product) => {
        const [result] = await productDB.getProducts({
          productCode: product.productCode,
        });
        return { ...result, orderId: product.orderId };
      })
    );

    listedOrders = allOrders.filter(order => 
      products.some(product => product.orderId.equals(order._id))
    );

    res.render("admin/orders", {
      orders: listedOrders,
      products,
      totalPages,
      currentPage
    });

  } catch (err) {
    res.send('Error: ' + err)
  }
};

exports.updateStatus = async (req, res) => {
  const { order_id, productCode, newStatus } = req.params;

  let status;
  switch (newStatus) {
    case "order-placed":
      status = "Order placed";
      break;

    case "packed":
      status = "Packed";
      break;

    case "shipped":
      status = "Shipped";
      break;

    case "out-for-delivery":
      status = "Out for delivery";
      break;

    case "delivered":
      status = "Delivered";
      break;
  }

  await orderDB.updateStatus(order_id, productCode, status);
  res.redirect("/admin/orders");
};

exports.cancellation = async (req, res) => {
  const { order_id, productCode, cancellation } = req.params;

  await orderDB.updateCancellation(order_id, productCode, cancellation);
  if (cancellation === "approved") {
    await orderDB.updateStatus(order_id, productCode, "Cancelled");
  } else {
    await orderDB.updateStatus(order_id, productCode, "Order placed");
  }
  res.redirect("/admin/orders");
};

exports.returnUpdate = async (req, res) => {

  const { order_id, productCode, returnStatus } = req.params;

  await orderDB.updateReturn(order_id, productCode, returnStatus);
  if (returnStatus === ("approved")) {
    await orderDB.updateStatus(order_id, productCode, "Return");
  } else if (returnStatus === "refunded") {
    const orderResult = await orderDB.findOrder(order_id);
    const [productResult] = await productDB.getProducts({ productCode: productCode });

    const date = new Date();
    const type = 'Refund';
    const user_id = orderResult.user_id;
    const amount = parseFloat(productResult.price);
    const product = productResult.productName;

    const wallet = await walletDB.getWallet(user_id);

    const isRefunded = wallet.transactions.some((transaction) => transaction.order_id === order_id && transaction.productCode === productCode);

    if (isRefunded) {
      res.redirect("/admin/orders");
    } else {
      const document = {
        order_id: order_id,
        productCode: productCode,
        amount: amount,
        date: date,
        type: type,
        product: product
      }
      const updateWallet = await walletDB.addToWallet(user_id, amount, document);
      res.redirect("/admin/orders");
    }
  }
};

exports.generateReport = async (req, res) => {
  try {
    // const today = new Date();
    // console.log(today);


    let { startDate, endDate } = req.body;

    startDate = new Date(startDate);
    endDate = new Date(endDate);
    endDate.setUTCHours(23, 59, 59, 999);

    const overallReport = await orderDB.getOverallReport(startDate, endDate);
    const individualReport = await orderDB.getIndividualReport(startDate, endDate);

    res.json({ success: true, overallReport: overallReport, individualReport: individualReport });

  } catch (error) {
    console.error('Error: ' + error);
  }
}