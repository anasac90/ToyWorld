const couponDB = require("../models/couponDB");

const couponChecking = async (req, res) => {
    try {
        let { couponCode, price } = req.body;
        price = parseFloat(price);

        const coupons = await couponDB.getCoupons({ couponCode: couponCode });

        if (coupons.length > 0) {
            let today = new Date();
            today.setHours(0,0,0,0);

            let expiry = new Date (coupons[0].expiryDate)
            expiry.setHours(0,0,0,0);

            
            
            if (expiry < today) {
                return res.status(200).json({ success: false, message: 'Coupon Expired' });
            } else if ( coupons[0].status != 'Active'){
                return res.status(200).json({ success: false, message: 'Coupon not active' });
            } else {
                const discountPercentage = parseFloat(coupons[0].discountPercentage);
                const maxDiscount = parseFloat(coupons[0].maxDiscount);
                let discount = price * discountPercentage / 100;
                discount = Math.min(discount, maxDiscount)

                return res.status(200).json({ success: true, discount: discount });
            }
        } else {
            return res.status(200).json({ success: false, message: 'Invalid coupon code' });
        }
    } catch (error) {
        console.log(error);
    }
}

const coupons = async (req, res) => {
    let coupons = await couponDB.getCoupons();
    res.render("admin/coupons", {
        coupons: coupons ? coupons : [],
        success: null,
        message: null,
    });
}

const addCouponPage = (req, res) => {
    res.render('admin/add-coupon', {
        couponData: null,
        success: null,
        message: null
    })
}

const addNewCoupon = async (req, res) => {
    let { couponCode, discountPercentage, maxDiscount, expiryDate, usageLimit, status } = req.body;
    let couponData = req.body;
    couponData = couponData ? couponData : null;
    let couponExist = await couponDB.getCoupons({ couponCode: { $regex: couponCode, $options: 'i' } });
    let date = new Date(expiryDate);
    date.setHours(0,0,0,0);

    let today = new Date();
    today.setHours(0,0,0,0);

    if (!couponCode.trim() || !discountPercentage.trim() || !maxDiscount.trim() || !expiryDate.trim() || !usageLimit.trim() || !status.trim()) {
        res.render('admin/add-coupon', {
            couponData,
            success: false,
            message: 'Fill all the field'
        })
    } else if (couponExist.length > 0) {
        res.render('admin/add-coupon', {
            couponData,
            success: false,
            message: 'Coupn already exist'
        })
    } else if (today > date) {
        res.render('admin/add-coupon', {
            couponData,
            success: false,
            message: 'Choose correct date'
        })
    } else {
        let document = {
            couponCode: couponCode,
            discountPercentage: discountPercentage,
            maxDiscount: maxDiscount,
            expiryDate: date,
            usageLimit: usageLimit,
            status: status
        }
        let result = await couponDB.addNewCoupon(document);

        res.render('admin/add-coupon', {
            couponData,
            success: true,
            message: 'Coupon added successfully'
        })
    }
}


const editCouponPage = async (req, res) => {
    const couponID = req.params.id;
    const [result] = await couponDB.getCoupons({ _id: couponID })

    res.render('admin/edit-coupon', {
        couponData: result,
        success: null,
        message: null
    })
}

const updateCoupon = async (req, res) => {
    let { couponID, couponCode, discountPercentage, maxDiscount, expiryDate, usageLimit, status } = req.body;

    let date = new Date(expiryDate);
    date.setHours(0,0,0,0);

    let today = new Date();
    today.setHours(0,0,0,0);

    let document = {
        couponCode: couponCode,
        discountPercentage: discountPercentage,
        maxDiscount: maxDiscount,
        expiryDate: date,
        usageLimit: usageLimit,
        status: status
    }

    let couponExist = await couponDB.getCoupons({ couponCode: couponCode });
    console.log(couponExist[0]?._id, couponID);

    if (!couponCode.trim() || !discountPercentage.trim() || !maxDiscount.trim() || !expiryDate.trim() || !usageLimit.trim() || !status.trim()) {
        res.render('admin/edit-coupon', {
            couponData: document,
            success: false,
            message: 'Fill all the field'
        })
    } else if (couponExist.length > 0 && couponExist[0]?._id != couponID) {
        res.render('admin/edit-coupon', {
            couponData: document,
            success: false,
            message: 'Coupn already exist'
        })
    } else if (today > date) {
        res.render('admin/edit-coupon', {
            couponData: document,
            success: false,
            message: 'Choose correct date'
        })
    } else {

        let result = await couponDB.updateCoupon(couponID, document);

        res.render('admin/edit-coupon', {
            couponData: document,
            success: true,
            message: 'Coupon updated successfully'
        })
    }

}

const deleteCoupon = async (req, res) => {
    const couponID = req.params.id;

    const result = await couponDB.deleteCoupon(couponID);
    let coupons = await couponDB.getCoupons();
    res.render("admin/coupons", {
        coupons: coupons ? coupons : [],
        success: true,
        message: 'Coupon deleted successfully'
    });

}



module.exports = {
    couponChecking,
    addCouponPage,
    coupons,
    addNewCoupon,
    editCouponPage,
    updateCoupon,
    deleteCoupon,
}