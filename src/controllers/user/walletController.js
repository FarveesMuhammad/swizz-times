import { Wallet } from "../../models/walletSchema.js";


const loadWallet = async (req, res) => {
    try {
        const userId = req.user._id
        if (!userId) return res.redirect('/login')

        let page = parseInt(req.query.page) || 1
          let limit= 5
        let skip =(page - 1) * limit

        let userWallet = await Wallet.findOne({userId })

        if (!userWallet) {
            userWallet = await Wallet.create({ userId, balance: 0, transactions: [] });
        }

            const totalTransactions =userWallet.transactions.length
        const totalPages =Math.ceil(totalTransactions / limit)

        const paginatedTransactions = userWallet.transactions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(skip, skip + limit);

        const walletData = {
            balance: userWallet.balance,
            transactions: paginatedTransactions
        };

        res.render('user/wallet', {
            wallet: walletData,
            currentPage: page,
            totalPages
        });

    } catch (error) {
        console.error("Error from load wallet:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};







export default {
    loadWallet
}