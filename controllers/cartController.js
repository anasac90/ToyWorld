const cartDB = require("../models/cartDB");
const productDB = require("../models/productDB");

exports.cart = async (req, res) => {
  try {
    const user_id = req.session.user[0]._id;
    const cart = await cartDB.findCart(user_id);

    let cartProducts = await Promise.all(
      cart.map(async (element) => {
        let productCode = element.productCode;
        let quantity = element.quantity;
        let result = await productDB.getProducts({ productCode: productCode });
        result[0].quantity = quantity; // adding quantity to the result
        return result[0]
      })
    );

    const today = new Date();

    const shipping = new Date(today);
    shipping.setDate(today.getDate() + 1);

    const delivery = new Date(shipping);
    delivery.setDate(shipping.getDate() + 3);

    res.render("users/cart", {
      user: req.session.user,
      cartProducts: cartProducts ? cartProducts : [],
      shipping,
      delivery,
    });
  } catch (error) {
    console.error("Error fetching cart products:", error);
    res.status(500).send("An error occurred while fetching cart data.");
  }
};

exports.addToCart = async (req, res) => {
  const productCode = req.params.id;
  const document = { productCode: productCode, quantity: 1 };
  const user_id = req.session.user[0]._id;

  let cart = await cartDB.findCartProductCode(productCode, user_id);

  if (!cart) {
    let result = await cartDB.addToCart(document, user_id);
    res.redirect("/cart");
  } else {
    const quantity = cart.quantity + 1;
    let result = await cartDB.updateQuantity(user_id,productCode,quantity)
    
    res.redirect("/cart");
  }
};

exports.updateQuantity = async (req, res) => {
    
  const { productCode, quantity } = req.body;
  const user_id = req.session.user[0]._id;

  try {
    // Update the quantity in the user's cart
    let result = await cartDB.updateQuantity(user_id, productCode, quantity);

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to update quantity:", error);
    res.json({ success: false });
  }
};

exports.deleteFromCart = async (req, res) => {
  let user_id = req.session.user[0]._id;
  let productCode = req.params.id;

  let result = await cartDB.deleteFromCart(user_id, productCode);
  res.redirect("/cart");
};
