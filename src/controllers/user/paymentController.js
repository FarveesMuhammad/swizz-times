import { razorpay } from "../../utils/razorpay.js";
import { Address } from "../../models/addressSchema.js";
import { Cart } from "../../models/cartSchema.js";
import { Order } from "../../models/orderSchema.js";
import { Coupon } from "../../models/couponSchema.js"
import { Product } from "../../models/productSchema.js";
import crypto from "crypto"


const createRazorpayOrder = async (req, res) => {
    try {
      
      const {
        addressId,
        paymentMethod,
        subtotal,
        discount,
        couponDiscount,
        shippingCharge,
        finalTotal
      } = req.body;
      
      // console.log(req.body)
      const finalTotalWithCoupon = Math.round(parseFloat(finalTotal));
      if (!finalTotalWithCoupon || finalTotalWithCoupon <= 0) {
        return res.status(400).json({ success: false, message: "Invalid amount" });
      }
      
      const options = {
        amount: finalTotalWithCoupon * 100,
        currency: "INR",
        receipt: `order_rcpt_${Date.now()}`
      };
      const razorpayOrder = await razorpay.orders.create(options);
      
      const userId = req.user._id;
      const userAddress = await Address.findOne({ userId });
      let selectedAddress
      
      if(typeof addressId == 'string'){

         selectedAddress = userAddress.address.find(
          addr => addr._id.toString() === addressId
        );
      }else{
        selectedAddress = addressId
      }

      const cart = await Cart.findOne({ userId }).populate("items.product");
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ success: false, message: "Cart is empty!" });
      }
      
      for (const item of cart.items) {
        if (item.product.quantity < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Not enough stock for ${item.product.productName}`
          });
        }
      }

  
     
      const tempOrder = new Order({
        userId,
        items: cart.items,
        totalAmount: finalTotalWithCoupon,
        subtotal,
        discount,
        couponDiscount,
        shippingCharge,
        address: selectedAddress,
        paymentMethod: "razorpay",
        paymentStatus: "Pending",
        orderStatus: "Payment Pending",
        razorpayOrderId: razorpayOrder.id,
      
      });
  
      await tempOrder.save();
 
      res.status(200).json({
        success: true,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        finalTotal: finalTotalWithCoupon,
        orderId: tempOrder._id, 
        orderDetails: {
          addressId,
          subtotal,
          discount,
          couponDiscount,
          shippingCharge,
          finalTotal
        }
      });
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };
  

  const verifyRazorpayPayment = async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        orderDetails,
        orderId,
        from
      } = req.body;

      // console.log(from)
      
      const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");
      
      if (generated_signature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: "Payment verification failed" });
      }
      const userId = req.user._id;
      // console.log(userId, "---------------------------------------")
      
      
      
      const cart = await Cart.findOne({ userId }).populate("items.product");
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ success: false, message: "Cart is empty!" });
      }
      // console.log(3)
      
      for (const item of cart.items) {
        if (item.product.quantity < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Not enough stock for ${item.product.productName}`
          });
        }
      }
      
      // console.log(4)
      for (const item of cart.items) {
        item.product.quantity -= item.quantity;
        item.product.totalSold = (item.product.totalSold || 0) + item.quantity;
        await item.product.save();
    }
            
            
            
            // console.log(5)
            
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 5);

      
  
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        
        {
          
          paymentStatus: "Completed",
          orderStatus: "Processing",
          deliveryDate,
          razorpay_payment_id,
          razorpay_signature
        },
        { new: true }
      );
  
  
      await Cart.findOneAndDelete({ userId });
      req.session.coupon = null;
  
      res.status(200).json({ success: true, message: "Payment successful", orderId: updatedOrder._id });
    } catch (error) {
      console.error("Error verifying Razorpay payment:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };
  



const handlePaymentFailure = async (req, res) => {
    try {
   
        
      const { orderId, failureReason } = req.body;

    const userId = req.user._id;
  
    const cart = await Cart.findOne({ userId }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty!" });
    }
  
    const order = await Order.findByIdAndUpdate(
        orderId,
        {
        items: cart.items,
          orderStatus: 'Payment Pending',
          paymentDetails: {
            failureReason,
            succeededAt: null
          }
        },
        { new: true }
      );
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: 'Order not found' });
      }
     
 
      for (const item of cart.items) {
        if (item.product.quantity < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Not enough stock for ${item.product.productName}`
          });
        }
      }
  
     

      await Cart.findOneAndDelete({ userId });
      req.session.coupon = null;

      res
        .status(200)
        .json({ success: true, message: 'Payment failure recorded', orderId });
    } catch (error) {
      console.error("Error handling payment failure :", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  
  const loadTransactionFailurePage = async (req, res) => {
    try {
      const { orderId } = req.query;
      
      // console.log(orderId)
      if (!orderId) {
        return res
        .status(400)
        .render('error', { message: 'Order ID is required' });
      }
      // console.log(orderId)
      
      const order = await Order.findById(orderId)
      // console.log(order)
      if (!order) {
        return res.status(404).render('error', { message: 'Order not found' });
      } 
      // console.log(1);

      
  // console.log(order.orderId,"======================================")
      res.render('user/transaction-failure', {order});
    } catch (error) {
      res.status(500).render('error', { message: 'Server error' });
    }
  };

  const retryPayment = async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const order = await Order.findOne({ orderId });

      
      
      if (!order) return res.json({ success: false, message: "Order not found" });
  
   
      if (!order.razorpayOrderId ) {
        return res.json({ success: false, message: "Missing Razorpay order info" });
      }
      
      res.json({
        success: true,
        addressId: order.address,
        paymentMethod: 'razorpay',
        subtotal: order.subtotal,
        discount: order.discount,
        couponDiscount: order.couponDiscount,
        shippingCharge: order.shippingCharge,
        finalTotal: order.totalAmount,
        razorpayOrderId: order.razorpayOrderId,
        amount: order.totalAmount
      });
    } catch (error) {
      console.error("Error in retryPayment:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };
  

  const retryVerifyRazorpayPayment = async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        orderDetails,
        orderId,
 
      } = req.body;

      
      const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");
      
      if (generated_signature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: "Payment verification failed" });
      }
      const userId = req.user._id;
            
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 5);

      const order = await Order.findOne({ orderId }).populate("items.product");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    for (const item of order.items) {
      const product = await Product.findById(item.product._id);



      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }


      if (product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });
      }

      product.quantity -= item.quantity;
      product.totalSold = (product.totalSold || 0) + item.quantity
      await product.save();
    }

      
      const updatedOrder = await Order.findOneAndUpdate(
        { orderId },
        {
          paymentStatus: "Completed",
          orderStatus: "Processing",
          deliveryDate,
          razorpay_payment_id,
          razorpay_signature,
        },
        { new: true }
      );

      req.session.coupon = null;
  
      res.status(200).json({ success: true, message: "Payment successful", orderId: updatedOrder._id });
    } catch (error) {
      console.error("Error verifying Razorpay payment:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };





export default {
    verifyRazorpayPayment,
    createRazorpayOrder,
    handlePaymentFailure,
    loadTransactionFailurePage,
    retryPayment,
    retryVerifyRazorpayPayment
}






