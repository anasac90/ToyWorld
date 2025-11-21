const wishListDB = require("../models/wishListDB");
const productDB = require("../models/productDB");

const wishlist = async (req, res, user_id) => {
    const productCodes = await wishListDB.wishlistProducts(user_id);

    let products = [];
    if (productCodes) {
        products = await Promise.all(
            productCodes.map(async productCode => {
                const [result] = await productDB.getProducts({ productCode: productCode });
                return result;
            })
        );
    }

    res.render('users/wishlist', {
        user: req.session.user,
        products,
    })
}

const addToWishList = async (req, res, productCode, user_id) => {
    try {
        const productCodes = await wishListDB.wishlistProducts(user_id);
        if (productCodes?.includes(productCode)) {
            res.status(500).json({ success: false, message: 'Product already in wish list' })
        } else {
            await wishListDB.addToWishList(productCode, user_id);
            res.json({ success: true });
        }
    } catch (error) {
        console.error('Unable to add to wishlist:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

const deleteWishlist = async (req, res, productCode, user_id) => {
    try {
        await wishListDB.deleteWishlist(productCode, user_id);
        res.status(200).json({ message: 'product deleted successfully' })
    } catch (error) {
        console.error('Error deleting the product:', error);
        res.status(500).json({ message: 'Failed to delete the product' })
    }
}

module.exports = {
    addToWishList,
    wishlist,
    deleteWishlist
}