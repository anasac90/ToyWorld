const couponDB = require("../models/couponDB");

const couponChecking = async (req,res)=>{
    const {couponCode}= req.body;
    if(couponCode === "10OFF"){
        return res.status(200).json({ success: true, discount: 100 });
    } else {
        return res.status(400).json({ success: false, message: 'Invalid coupon code' });
    }
}

const coupons = async (req,res)=>{
    let coupons = await couponDB.getCoupons();
    res.render("admin/coupons",{
        coupons:coupons?coupons:[],
        success:null,
        message:null,
    });
}

const addCouponPage = (req,res)=>{
    res.render('admin/add-coupon',{
        couponData:null,
        success:null,
        message:null
    })
}

const addNewCoupon = async (req,res)=>{
    let {couponCode, discountPercentage, maxDiscount, expiryDate, usageLimit, status} = req.body;
    let couponData = req.body;
    couponData = couponData?couponData:null;
    let couponExist = await couponDB.getCoupons({couponCode:couponCode});
    let date = new Date(expiryDate);
    let today = new Date();

    if(!couponCode.trim() || !discountPercentage.trim() || !maxDiscount.trim() || !expiryDate.trim() || !usageLimit.trim() || !status.trim()){
        res.render('admin/add-coupon',{
            couponData,
            success:false,
            message:'Fill all the field'
        })
    } else if (couponExist.length > 0){
        res.render('admin/add-coupon',{
            couponData,
            success:false,
            message:'Coupn already exist'
        })
    } else if(today >= date){
        res.render('admin/add-coupon',{
            couponData,
            success:false,
            message:'Choose correct date'
        })
    } else {
        let document = {
            couponCode:couponCode,
            discountPercentage:discountPercentage,
            maxDiscount:maxDiscount,
            expiryDate:date,
            usageLimit:usageLimit,
            status:status
        }
        let result = await couponDB.addNewCoupon(document);

        res.render('admin/add-coupon',{
            couponData,
            success:true,
            message:'Coupon added successfully'
        }) 
    }
}


const editCouponPage = async (req,res)=>{
    const couponID = req.params.id;
    const [result] = await couponDB.getCoupons({_id:couponID})

    res.render('admin/edit-coupon',{
        couponData:result,
        success: null,
        message: null
    })
}

const updateCoupon = async (req,res)=>{
    let {couponID, couponCode, discountPercentage, maxDiscount, expiryDate, usageLimit, status} = req.body;

    let date = new Date(expiryDate);
    let today = new Date();

    let document = {
        couponCode:couponCode,
        discountPercentage:discountPercentage,
        maxDiscount:maxDiscount,
        expiryDate:date,
        usageLimit:usageLimit,
        status:status
    }

    let couponExist = await couponDB.getCoupons({couponCode:couponCode});
    console.log(couponExist[0]?._id, couponID);

    if(!couponCode.trim() || !discountPercentage.trim() || !maxDiscount.trim() || !expiryDate.trim() || !usageLimit.trim() || !status.trim()){
        res.render('admin/edit-coupon',{
            couponData:document,
            success:false,
            message:'Fill all the field'
        })
    } else if (couponExist.length > 0 && couponExist[0]?._id != couponID){
        res.render('admin/edit-coupon',{
            couponData:document,
            success:false,
            message:'Coupn already exist'
        })
    } else if(today >= date){
        res.render('admin/edit-coupon',{
            couponData:document,
            success:false,
            message:'Choose correct date'
        })
    } else {
        
        let result = await couponDB.updateCoupon(couponID, document);

        res.render('admin/edit-coupon',{
            couponData:document,
            success:true,
            message:'Coupon updated successfully'
        }) 
    }

}

const deleteCoupon = async (req,res)=>{
    const couponID = req.params.id;

    const result = await couponDB.deleteCoupon(couponID);
    let coupons = await couponDB.getCoupons();
    res.render("admin/coupons",{
        coupons:coupons?coupons:[],
        success:true,
        message:'Coupon deleted successfully'
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