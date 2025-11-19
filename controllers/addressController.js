const addressDB = require("../models/addressDB");




exports.addAddress = (req, res) => {
  let url = req.url;
  console.log(url);
  

    if (req.body) {
      res.render("users/add-address", {
        user: req.session.user,
        addressData: req.body,
        warning: null,
        url
      });
    } else {
      res.render("users/add-address", {
        user: req.session.user,
        addressData: null,
        warning: null,
        url
      });
    }
  };
  
  exports.submitAddress = async (req, res) => {
    let redirectURL = req.body.redirectURL;

    let warning = null;
    if (!req.body.house) {
      warning = "House name did not filled";
      res.render("users/add-address", {
        user: req.session.user,
        addressData: req.body,
        warning,
      });
    } else if (!req.body.street) {
      warning = "Street name did not filled";
      res.render("users/add-address", {
        user: req.session.user,
        addressData: req.body,
        warning,
      });
    } else if (!req.body.post) {
      warning = "Post office name did not filled";
      res.render("users/add-address", {
        user: req.session.user,
        addressData: req.body,
        warning,
      });
    } else if (!req.body.city) {
      warning = "City did not filled";
      res.render("users/add-address", {
        user: req.session.user,
        addressData: req.body,
        warning,
      });
    } else if (!req.body.district) {
      warning = "District did not filled";
      res.render("users/add-address", {
        user: req.session.user,
        addressData: req.body,
        warning,
      });
    } else if (!req.body.state) {
      warning = "State did not filled";
      res.render("users/add-address", {
        user: req.session.user,
        addressData: req.body,
        warning,
      });
    } else if (!req.body.pincode) {
      warning = "Pincode did not filled";
      res.render("users/add-address", {
        user: req.session.user,
        addressData: req.body,
        warning,
      });
    } else if (!req.body.mobile) {
      warning = "Mobile did not filled";
      res.render("users/add-address", {
        user: req.session.user,
        addressData: req.body,
        warning,
      });
    } else {
      let user_id = req.session.user[0]._id;
      let document = req.body;
      await addressDB.insertAddress(document, user_id);
      req.session.addresses = await addressDB.findUserAddress(user_id);

      if(redirectURL == "/address/add-checkout"){
        res.redirect("/checkout");
      }else {
        res.render("users/my-account", {
        user: req.session.user,
        addresses: req.session.addresses ? req.session.addresses : [],
        orders: req.session.orders ? req.session.orders : [],
        status: "Address added successfully",
        warning: null,
        redirectTo:'address'
      });
      }
    }
  };
  
  let addressId = "";
  exports.editAddress = async (req, res) => {
    addressId = req.params.id;
    let addressData = await addressDB.findAddress(addressId);
    res.render("users/address-edit", {
      user: req.session.user,
      addressData,
      NewAddressData: null,
      warning: null,
    });
  };
  
  exports.updateAddress = async (req, res) => {
    let warning = null;
    if (!req.body.house) {
      warning = "House name did not filled";
      res.render("users/address-edit", {
        user: req.session.user,
        addressData: [req.body],
        warning,
      });
    } else if (!req.body.street) {
      warning = "Street name did not filled";
      res.render("users/address-edit", {
        user: req.session.user,
        addressData: [req.body],
        warning,
      });
    } else if (!req.body.post) {
      warning = "Post office name did not filled";
      res.render("users/address-edit", {
        user: req.session.user,
        addressData: [req.body],
        warning,
      });
    } else if (!req.body.city) {
      warning = "City did not filled";
      res.render("users/address-edit", {
        user: req.session.user,
        addressData: [req.body],
        warning,
      });
    } else if (!req.body.district) {
      warning = "District did not filled";
      res.render("address-edit", {
        user: req.session.user,
        addressData: [req.body],
        warning,
      });
    } else if (!req.body.state) {
      warning = "State did not filled";
      res.render("users/address-edit", {
        user: req.session.user,
        addressData: [req.body],
        warning,
      });
    } else if (!req.body.pincode) {
      warning = "Pincode did not filled";
      res.render("users/address-edit", {
        user: req.session.user,
        addressData: [req.body],
        warning,
      });
    } else if (!req.body.mobile) {
      warning = "Mobile did not filled";
      res.render("users/address-edit", {
        user: req.session.user,
        addressData: [req.body],
        warning,
      });
    } else {
      let user_id = req.session.user[0]._id;
      let document = req.body;
      let result = await addressDB.updateAddress(addressId, document);
      req.session.addresses = await addressDB.findUserAddress(user_id);
  
      res.render("users/my-account", {
        user: req.session.user,
        addresses: req.session.addresses ? req.session.addresses : [],
        orders: req.session.orders ? req.session.orders : [],
        status: "Address updated successfully",
        warning: null,
        redirectTo:'address'
      });
    }
  };
  
  exports.deleteAddress = async (req,res)=>{
    addressId = req.params.id;
    let user_id = req.session.user[0]._id;
    await addressDB.deleteAddress(addressId);
    req.session.addresses = await addressDB.findUserAddress(user_id);
  
    res.render("users/my-account", {
        user: req.session.user,
        addresses: req.session.addresses ? req.session.addresses : [],
        orders: req.session.orders ? req.session.orders : [],
        status: "Address deleted successfully",
        warning: null,
        redirectTo:'address'
      })
  }