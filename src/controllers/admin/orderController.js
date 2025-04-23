import { Order } from "../../models/orderSchema.js"
import { User } from "../../models/userSchema.js";
import { Product } from "../../models/productSchema.js"
import { Wallet } from "../../models/walletSchema.js";

const loadOrderPage = async (req, res) => {
    try {
        const { page = 1, limit = 5, search = "" } = req.query; // Default page=1, limit=5

        const query = {};

       
        if (search) {
            const users = await User.find({ username: { $regex: search, $options: "i" } }, "_id");
            const userIds = users.map(user => user._id);
            query.userId = { $in: userIds };
        }

             const totalOrders = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate("userId", "username email")
        .populate("items.product")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

        res.render("admin/orders", {
                orders,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalOrders / limit),
                search
        });

    } catch (error) {
        console.error("Error from admin order page:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};


const orderDetailPage = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId).populate("items.product")
        // console.log(order)

        if (!order) {
            return res.status(404).send("Order not found");
        }

        res.render("admin/orderDetails", { order });
    } catch (error) {
        console.error("Error fetching order details:", error);
        res.status(500).send("Internal Server Error");
    }
};
const updateStatus = async (req,res) =>{
    try {
        const { orderId } = req.params;
        const { status } = req.body;


        const validStatuses = ["Pending", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid order status" });
        }

        const order = await Order.findByIdAndUpdate(orderId, { orderStatus: status }, { new: true });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        return res.json({ success: true, message: "Order status updated successfully", order });

    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}
const approveReturn = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { action } = req.body

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.returnStatus !== "Pending") {
            return res.status(400).json({ success: false, message: "Order return is not pending" });
        }

        if (action === "Approved") {
            order.orderStatus = "Returned";
            order.returnStatus = "Approved";

            for (let item of order.items) {
                let product = await Product.findById(item.product);
                product.quantity += item.quantity;
                await product.save();
            }

            if (order.paymentMethod === "razorpay" || order.paymentMethod === "wallet" && order.paymentStatus === "Completed") {
                const userId = order.userId;
                let userWallet = await Wallet.findOne({ userId });

                if (!userWallet) {
                    userWallet = await Wallet.create({ userId, balance: 0, transactions: [] });
                }

                const refundAmount = order.totalAmount - order.shippingCharge
                userWallet.transactions.push({
                    transactionId: `refund_${orderId}`,
                    amount: refundAmount,
                    type: "Credit",
                    status: "Completed",
                    createdAt: new Date(),
                });

                userWallet.balance += refundAmount;
                await userWallet.save();
            }

            await order.save();
            return res.json({ success: true, message: "Return approved and refund processed" });

        } else if (action === "Rejected") {
            order.returnStatus = "Rejected";
            order.orderStatus = "Delivered"

            await order.save();
            return res.json({ success: true, message: "Return request rejected" });
        }

        return res.status(400).json({ success: false, message: "Invalid action" });

    } catch (error) {
        console.error("Error approving return:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};




export default {
    loadOrderPage,
    orderDetailPage,
    updateStatus,
    approveReturn
}