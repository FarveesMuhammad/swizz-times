import { Wallet } from "../../models/walletSchema.js";
import { User } from "../../models/userSchema.js";
import { Order } from "../../models/orderSchema.js";

const loadWalletPage = async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;
        page = Math.max(parseInt(page), 1);
        limit = Math.max(parseInt(limit), 1);
        const skip = (page - 1) * limit;

        const wallets = await Wallet.find().populate("userId", "name username");
        
     const allTransactions = [];

        wallets.forEach(wallet => {
            wallet.transactions.forEach(txn => {
                allTransactions.push({
                    ...txn._doc,
                    user: wallet.userId
                });
            });
        });
        const sortedTxns = allTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const paginatedTxns = sortedTxns.slice(skip, skip + limit);
        const totalTransactions = allTransactions.length;
        const totalPages = Math.ceil(totalTransactions / limit);

        res.render("admin/wallet", {
            transactions: paginatedTxns,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error("Error loading wallet page:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};


const transactionDetailPage = async (req, res) => {
    try {
        // console.log(1);
        
        const transactionId = req.params.transactionId;

        // console.log(transactionId)
        
  const wallet = await Wallet.findOne({"transactions.transactionId": transactionId})

        if (!wallet) {
            
             return res.status(404).render("admin/404", { message:"Transaction not found" })
        }

        const transaction = wallet.transactions.find(tran => tran.transactionId === transactionId)
        let relatedOrder = null;

if (transaction?.orderId) {
  relatedOrder = await Order.findOne({ orderId: transaction.orderId }).lean()
}
        const user = await User.findById(wallet.userId)

        return res.render("admin/transactionDetails", {
            transaction,
            user,
            relatedOrder
        })

    } catch (error) {
        console.error("Error loading transaction detail page:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const orderDetailsPage = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId)
        .populate("items.product")   
        // .populate({
        //     path: "address",  
        //     model: "Address"
        // })


        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found!" });
        }
      

        res.render("admin/walletOrderDetails", { order });

    } catch (error) {
        console.error("Error from order details page:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};



export default {
    loadWalletPage,
    transactionDetailPage,
    orderDetailsPage
}