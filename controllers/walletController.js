const walletDB = require ('../models/walletDB');

const wallet = async (req,res)=>{
    const user_id = req.session.user[0]._id;

    const walletData = await walletDB.getWallet(user_id);
    const walletBalance = walletData?.balanceAmount;
    const transactions = walletData?.transactions;
    res.render('users/wallet',{
        user:req.session.user,
        walletBalance,
        transactions
    })
}


module.exports = {
    wallet,
}