const productDB = require("../models/productDB");
const categoryDB = require("../models/categoryDB");
const offerDB = require("../models/offerDB");


const offersManagement = async (req, res) => {
    let { activeTab } = req.params;
    let products = await productDB.getProducts();
    let categories = await categoryDB.getCategories();
    

    let productOffer = await offerDB.findOffer({ offerType: 'product' });
    let categoryOffer = await offerDB.findOffer({ offerType: 'category' });
    let referralOffer = await offerDB.findOffer({ offerType: 'referral' });

    res.render('admin/offers', {
        activeTab: activeTab ? activeTab : '',
        products,
        categories,
        productOffer: productOffer ? productOffer.reverse() : [],
        categoryOffer: categoryOffer ? categoryOffer.reverse() : [],
        referralOffer: referralOffer ? referralOffer : [],
        success: null,
        message: null
    });
}

const offersManagementTab = async (req, res) => {
    let { activeTab } = req.params;
    let products = await productDB.getProducts();
    let categories = await categoryDB.getCategories();

    let productOffer = await offerDB.findOffer({ offerType: 'product' });
    let categoryOffer = await offerDB.findOffer({ offerType: 'category' });
    let referralOffer = await offerDB.findOffer({ offerType: 'referral' });

    res.render('admin/offers', {
        activeTab: activeTab ? activeTab : '',
        products,
        categories,
        productOffer: productOffer ? productOffer.reverse() : [],
        categoryOffer: categoryOffer ? categoryOffer.reverse() : [],
        referralOffer: referralOffer ? referralOffer : [],
        success: null,
        message: null
    });
}

const addProductOffer = async (req, res) => {
    try {
        const { productName, productCode, discountPrecentage, maxDiscount, expiryDate } = req.body;
        let today = new Date();
        const date = new Date(expiryDate);
        let alreadyExist = await offerDB.findOffer({ offerType: 'product', productCode: productCode });

        if (productName.trim() === "" || productCode.trim() === "" || discountPrecentage.trim() === "" || maxDiscount.trim() === "" || expiryDate.trim() === "") {
            res.json({ success: false, message: "Fill the form correctly" })
        } else if (parseInt(discountPrecentage) > 99 || parseInt(discountPrecentage) < 1) {
            res.json({ success: false, message: "Choose a correct offer precentage" })
        } else if (maxDiscount < 100) {
            res.json({ success: false, message: "Minimum discount amount is 100" })
        } else if (today >= date) {
            res.json({ success: false, message: "Choose a correct date" })
        } else if (alreadyExist?.length != 0) {
            res.json({ success: false, message: "Offer for this product already exist" })
        } else {
            const offerData = {
                offerType: 'product',
                productName: productName,
                productCode: productCode,
                discountPrecentage: discountPrecentage,
                maxDiscount: maxDiscount,
                expiryDate: date
            }

            const result = await offerDB.addOffer(offerData, productCode);
            res.json({ success: true, productOffer: result })
        }

    } catch (error) {
        console.error('Error adding product offer:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }

}

const addCategoryOffer = async (req, res) => {
    try {
        const { categoryName, categoryID, discountPrecentage, maxDiscount, expiryDate } = req.body;
        let today = new Date();
        const date = new Date(expiryDate);
        let alreadyExist = await offerDB.findOffer({ offerType: 'category', categoryID: categoryID });

        if (categoryName.trim() === "" || categoryID.trim() === "" || discountPrecentage.trim() === "" || maxDiscount.trim() === "" || expiryDate.trim() === "") {
            res.json({ success: false, message: "Fill the form correctly" })
        } else if (parseInt(discountPrecentage) > 99 || parseInt(discountPrecentage) < 1) {
            res.json({ success: false, message: "Choose a correct offer precentage" })
        } else if (maxDiscount < 100) {
            res.json({ success: false, message: "Minimum discount amount is 100" })
        } else if (today >= date) {
            res.json({ success: false, message: "Choose a correct date" })
        } else if (alreadyExist?.length != 0) {
            res.json({ success: false, message: "Offer for this category already exist" })
        } else {
            const offerData = {
                offerType: 'category',
                categoryName: categoryName,
                categoryID: categoryID,
                discountPrecentage: discountPrecentage,
                maxDiscount: maxDiscount,
                expiryDate: date
            }

            const result = await offerDB.addOffer(offerData, categoryID);
            res.json({ success: true, categoryOffer: result })
        }

    } catch (error) {
        console.error('Error adding category offer:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }

}

const addReferralOffer = async (req, res) => {
    try {
        const { referralAmount, expiryDate } = req.body;
        let today = new Date();
        const date = new Date(expiryDate);

        if (referralAmount.trim() === "" || expiryDate.trim() === "") {
            res.json({ success: false, message: "Fill the form correctly" })
        } else if (referralAmount < 10) {
            res.json({ success: false, message: "Minimum refferral amount should be 10" })
        } else if (today >= date) {
            res.json({ success: false, message: "Choose a correct date" })
        } else {
            const offerData = {
                offerType: 'referral',
                referralAmount: referralAmount,
                expiryDate: date
            }

            const result = await offerDB.addOffer(offerData);
            res.json({ success: true, referralOffer: result })
        }

    } catch (error) {
        console.error('Error adding category offer:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

const editProductOffer = async (req, res, offerID) => {
    const [offerData] = await offerDB.findOffer({ _id: offerID });

    res.render('admin/edit-productOffer', { offerData: offerData, success: null, message: null })
}

const editCategoryOffer = async (req, res, offerID) => {
    const [offerData] = await offerDB.findOffer({ _id: offerID });

    res.render('admin/edit-categoryOffer', { offerData: offerData, success: null, message: null })
}

const updateOffer = async (req, res, offerID) => {
    try {
        let { offerType } = req.body;
        let today = new Date();

        if (offerType === 'product') {
            let { productName, productCode, discount, maxLimit, expiryDate } = req.body;
            let date = new Date(expiryDate);
            let offerData = {
                _id: offerID,
                offerType: offerType,
                productName: productName,
                productCode: productCode,
                discountPrecentage: discount,
                maxDiscount: maxLimit,
                expiryDate: date
            }

            if (!productName || !productCode || !discount || !maxLimit || !expiryDate) {
                res.render('admin/edit-productOffer', { offerData, success: false, message: 'Please fill all the field' })
            } else if (productName.trim() === "" || productCode.trim() === "" || discount.trim() === "" || maxLimit.trim() === "" || expiryDate.trim() === "") {
                res.render('admin/edit-productOffer', { success: false, message: 'Please fill the form correctly' })
            } else if (parseInt(discount) > 99 || parseInt(discount) < 1) {
                res.render('admin/edit-productOffer', { offerData, success: false, message: 'Choose a correct offer precentage' })
            } else if (maxLimit < 100) {
                res.render('admin/edit-productOffer', { offerData, success: false, message: 'Maximum discount amount should be 100 or more' })
            } else if (today >= date) {
                res.render('admin/edit-productOffer', { success: false, message: 'Choose a correct date' })
            } else {
                const newOfferData = {
                    discountPrecentage: discount,
                    maxDiscount: maxLimit,
                    expiryDate: date
                }

                const result = await offerDB.updateOffer(newOfferData, offerID);
                [offerData] = await offerDB.findOffer({ _id: offerID });
                res.render('admin/edit-productOffer', { offerData, success: true, message: 'Offer updated successfully' })
            }
        } else if (offerType === 'category') {
            let { categoryName, categoryID, discount, maxLimit, expiryDate } = req.body;
            let date = new Date(expiryDate);
            let offerData = {
                _id: offerID,
                offerType: offerType,
                categoryName: categoryName,
                categoryID: categoryID,
                discountPrecentage: discount,
                maxDiscount: maxLimit,
                expiryDate: date
            }

            if (!categoryName || !discount || !maxLimit || !expiryDate) {
                res.render('admin/edit-categoryOffer', { offerData, success: false, message: 'Please fill all the field' })
            } else if (categoryName.trim() === "" || categoryID.trim() === "" || discount.trim() === "" || maxLimit.trim() === "" || expiryDate.trim() === "") {
                res.render('admin/edit-categoryOffer', { offerData, success: false, message: 'Fill the form correctly' })
            } else if (parseInt(discount) > 99 || parseInt(discount) < 1) {
                res.render('admin/edit-categoryOffer', { offerData, success: false, message: 'Choose a correct offer precentage' })
            } else if (maxLimit < 100) {
                res.render('admin/edit-categoryOffer', { offerData, success: false, message: 'Maximum discount amount should be 100 or more' })
            } else if (today >= date) {
                res.render('admin/edit-categoryOffer', { offerData, success: false, message: 'Choose a correct date' })
            } else {
                const newOfferData = {
                    discountPrecentage: discount,
                    maxDiscount: maxLimit,
                    expiryDate: date
                }

                const result = await offerDB.updateOffer(newOfferData, offerID);
                [offerData] = await offerDB.findOffer({ _id: offerID });
                res.render('admin/edit-categoryOffer', { offerData, success: true, message: 'Offer updated successfully' })
            }
        } else if (offerType === 'referral') {
            const { referralAmount, expiryDate } = req.body;
            const date = new Date(expiryDate);
            let referralOffer = [{
                _id: offerID,
                offerType: offerType,
                referralAmount: referralAmount,
                expiryDate: date
            }];
            let success;
            let message;

            if (referralAmount.trim() === "" || expiryDate.trim() === "") {
                success = false, message = "Fill the form correctly"
            } else if (referralAmount < 10) {
                success = false, message = "Minimum refferral amount should be 10"
            } else if (today >= date) {
                success = false, message = "Choose a correct date"
            } else {
                const newOfferData = {
                    referralAmount: referralAmount,
                    expiryDate: date
                }

                const result = await offerDB.updateOffer(newOfferData, offerID);
                success = true, message = 'Offer updated successfully'
            }

            let activeTab = 'referralOffer';
            let products = await productDB.getProducts();
            let categories = await categoryDB.getCategories();

            let productOffer = await offerDB.findOffer({ offerType: 'product' });
            let categoryOffer = await offerDB.findOffer({ offerType: 'category' });
            referralOffer = await offerDB.findOffer({ _id: offerID });

            res.render('admin/offers', {
                activeTab: activeTab ? activeTab : '',
                products,
                categories,
                productOffer: productOffer ? productOffer.reverse() : [],
                categoryOffer: categoryOffer ? categoryOffer.reverse() : [],
                referralOffer: referralOffer ? referralOffer : [],
                success,
                message
            });
        }
    } catch (error) {
        console.error('Error: ', error);
    }
}

const deleteOffer = async (req, res, offerID, offerType) => {
    try {
        const result = await offerDB.deleteOffer(offerID);
        res.json({ success: true, message: 'Offer deleted successfully' })
    } catch (error) {
        console.error('Error: ', error);
        res.json({ success: false, message: 'Error in deleting the offer' })
    }

}

module.exports = {
    offersManagement,
    addProductOffer,
    addCategoryOffer,
    offersManagementTab,
    editProductOffer,
    editCategoryOffer,
    updateOffer,
    deleteOffer,
    addReferralOffer,
}