import { Order } from "../../models/orderSchema.js";
import { Product } from "../../models/productSchema.js";
import { Address } from "../../models/addressSchema.js";
import { Wallet } from "../../models/walletSchema.js";
import { Category } from "../../models/categorySchema.js";
import PDFDocument from "pdfkit"
import fs from "fs"

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
      

        res.render("user/orderDetails", { order });

    } catch (error) {
        console.error("Error from order details page:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const loadOrderPage = async (req, res) => {
    try {
        const userId = req.user._id;
        if (!userId) {
            return res.redirect('/login');
        }

        const page = parseInt(req.query.page) || 1
        const limit = 5
        const skip = (page - 1) * limit

        
        const orders = await Order.find({ userId })
            .populate("items.product")
            .sort({ createdAt: -1 }) 
            .skip(skip)
            .limit(limit);

            // console.log(orders)

        const totalOrders = await Order.countDocuments({ userId });
        const totalPages = Math.ceil(totalOrders / limit);

        res.render('user/orders', { 
            orders, 
            currentPage: page,
            totalPages
        });

    } catch (error) {
        console.error("Error from order listing page:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

const cancelOrder = async (req,res) =>{
    try {
        const { orderId } = req.params
        const { reason } = req.body

        const order = await Order.findById(orderId).populate("items.product")
        if (!order) return res.status(404).json({ success: false, message: "Order not found!" })

        if (order.orderStatus !== "Processing") {
        return res.status(400).json({ success: false, message: "Only processing orders can be canceled!" })
        }
            order.orderStatus = "Cancelled"
    order.cancellationReason = reason
        await order.save()

        for (let item of order.items) {
            let product = await Product.findById(item.product._id)
                        product.quantity += item.quantity
            await product.save()
        }
       
        
        if (order.paymentMethod === "razorpay" || order.paymentMethod === "wallet"&& order.paymentStatus === "Completed") {
            const userId = order.userId;

            let userWallet = await Wallet.findOne({ userId });
          
            
            if (!userWallet) {
            
                userWallet = await Wallet.create({
                    userId,
                    balance: 0,
                    transactions: [],
                })
            }

    
            const refundAmount = order.totalAmount - order.shippingCharge        
                userWallet.transactions.push({
                transactionId: `refund_${orderId}`,
                amount: refundAmount,
                type: "Credit",
                status: "Completed",
                createdAt: new Date(),
            })

           
            userWallet.balance += refundAmount;
            await userWallet.save();
        }

        return res.json({ success: true, message: "Order canceled successfully" })

        
    } catch (error) {
        console.error("Error from  canceling order :", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" })
    }
}

const cancelProduct = async (req,res) =>{
    try {

        const { orderId, productId } = req.params;
        const { reason } = req.body

    const order = await Order.findById(orderId).populate("items.product");
        if (!order) return res.status(404).json({ success: false, message: "Order not found!" });

 

   if (order.orderStatus !== "Processing") {

            return res.status(400).json({ success: false, message: "Only processing orders can be modified!" })
        }
        const itemIndex = order.items.findIndex(i => i.product._id.toString() === productId)


        if (itemIndex === -1) return res.status(404).json({ success: false, message: "Product not found in order!" })

        let item = order.items[itemIndex]

  let product = await Product.findById(productId)
        product.quantity += item.quantity
        await product.save()

       
        const category = await Category.findById(product.category)
       
       
     const productOffer = product.productOffer || 0

         const categoryOffer = category?.categoryOffer || 0

        const maxOffer = Math.max(productOffer, categoryOffer);
    
        const discountedPricePerUnit = item.price - (item.price * maxOffer / 100);
         console.log("item price",item.price)
         
         const discountedCouponDiscount = discountedPricePerUnit - (order.couponDiscount/order.items.length)
         const refundAmount = discountedCouponDiscount * item.quantity;
          console.log("refund amount",refundAmount)

        order.items.splice(itemIndex, 1);
        if (order.items.length === 0) {
            order.orderStatus = "Cancelled";
     }

            await order.save()

            if (order.paymentMethod === "razorpay" || order.paymentMethod === "wallet" && order.paymentStatus === "Completed") {
                const userId = order.userId;
    
                let userWallet = await Wallet.findOne({ userId });
    
                if (!userWallet) {
                 
                    userWallet = await Wallet.create({
                        userId,
                        balance: 0,
                        transactions: [],
                    });
                }
    
            
                userWallet.transactions.push({
                    transactionId: `refund_${orderId}_${productId}`,
                    amount: refundAmount,
                    type: "Credit",
                    status: "Completed",
                    createdAt: new Date(),
                });
    
                userWallet.balance += refundAmount;
                await userWallet.save();
            }
     return res.json({ success: true, message: "Product canceled successfully" });
        
    } catch (error) {
        console.error("Error from  canceling product :", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" })
    }
}


const returnOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;

        const order = await Order.findById(orderId).populate("items.product");

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.orderStatus !== "Delivered") {
            return res.status(400).json({ success: false, message: "Only delivered orders can be returned" });
        }

       
        order.orderStatus = "Return Pending";
        order.returnReason = reason;
        order.returnStatus = "Pending"

        await order.save();

        return res.json({ success: true, message: "Return request submitted. Awaiting admin approval." });

    } catch (error) {
        console.error("Error returning order:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};



const downloadInvoice = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findOne({ orderId })
            .populate({ path: "items.product", select: "productName" })
            .populate({ path: "userId", select: "name email" })
            .lean();

        if (!order) return res.status(404).send("Order not found");

        const doc = new PDFDocument({ margin: 50, size: "A4" });

     
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Invoice-${orderId}.pdf`);

        doc.pipe(res);

        doc.fontSize(24).text("SWIZZ TIMES", 50, 50)
            .fontSize(10).text("www.swizz-times.com", 50, 80)
            .text("support@swizz-times.com", 50, 95)
            .text("+91 98765 43210", 50, 110);

      
        doc.fontSize(20).text("INVOICE", 400, 50, { align: "right" })
            .fontSize(10)
            .text(`Invoice No: ${orderId}`, 400, 80, { align: "right" })
            .text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 95, { align: "right" })
            .text(`Generated: ${new Date().toLocaleDateString()}`, 400, 110, { align: "right" });

        doc.moveDown();
        doc.fontSize(12).text("Billed To:", 50, 150)
            .font("Helvetica").text(`${order.userId.email}`, 50, 180)
            .text(order.shippingAddress || "Shipping address not available", 50, 195);

        doc.moveTo(50, 220).lineTo(550, 220).stroke();

        let y = 240;
        doc.font("Helvetica-Bold").fontSize(12)
            .text("Product", 50, y)
            .text("Qty", 300, y)
            .text("Price", 370, y)
            .text("Subtotal", 450, y);
        doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke();

  
        y += 30;
        doc.font("Helvetica").fontSize(11);
        order.items.forEach((item) => {
            doc.text(item.product.productName, 50, y)
                .text(item.quantity, 300, y)
                .text(`₹${item.price.toFixed(2)}`, 370, y)
                .text(`₹${(item.price * item.quantity).toFixed(2)}`, 450, y);
            y += 20;
        });

        y += 20;
        doc.font("Helvetica-Bold")
            .text("Subtotal:", 370, y)
            .text(`₹${order.totalAmount.toFixed(2)}`, 450, y);

        if (order.discountAmount) {
            y += 15;
            doc.text("Discount:", 370, y)
                .text(`-₹${order.discountAmount.toFixed(2)}`, 450, y);
        }

        if (order.deliveryCharge) {
            y += 15;
            doc.text("Delivery:", 370, y)
                .text(`₹${order.deliveryCharge.toFixed(2)}`, 450, y);
        }

        y += 15;
        doc.fontSize(13)
            .text("Total:", 370, y)
            .text(`₹${order.totalAmount.toFixed(2)}`, 450, y);


        y += 30;
        doc.font("Helvetica").fontSize(10)
            .text(`Payment Status: ${order.paymentStatus || "N/A"}`, 50, y)
            .text(`Payment ID: ${order.razorpay_payment_id || "N/A"}`, 50, y + 15);

        
        y += 50;
        doc.fontSize(9).fillColor("gray")
            .text("Thank you for shopping with SWIZZ TIMES!", 50, y)
            .text("This is a system-generated invoice and does not require a signature.", 50, y + 15);

      
        doc.end();
    } catch (error) {
        console.error("Error generating invoice:", error);
        res.status(500).send("Error generating invoice");
    }
};





export default {
    orderDetailsPage,
    loadOrderPage,
    cancelOrder,
    cancelProduct,
    returnOrder,
    downloadInvoice
}



