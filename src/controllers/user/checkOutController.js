import { User } from "../../models/userSchema.js";
import { Address } from "../../models/addressSchema.js";
import { Cart } from "../../models/cartSchema.js";
import { Order } from "../../models/orderSchema.js";
import { Coupon } from "../../models/couponSchema.js"
import { Wallet } from "../../models/walletSchema.js";

const getCheckOutPage = async (req,res) =>{
    try {

        const userId = req.user._id
        if (!userId) {
            return res.redirect('/login');
        }
        const address = await Address.findOne({userId})
        const userAddresses = address ? address.address : []

        const cart = await Cart.findOne({ userId }).populate({
            path: "items.product",
            model: "Product",
            populate: {
                path: "category",  
                model: "Category"
            } 
        });


        if (!cart || cart.items.length === 0) {
            return res.redirect('/swizz-times/shop');
        }

     


        let totalDiscount = 0;
        let totalPrice = 0;

        cart.items.forEach(item => {
            const {salePrice , productOffer, category} = item.product
            const categoryOffer = category?.offer || 0

    
            const maxOffer = Math.max(productOffer, categoryOffer)
            // console.log(maxOffer)

            const discountAmount = (salePrice * maxOffer) / 100;
            totalDiscount += discountAmount * item.quantity

            totalPrice += (salePrice - discountAmount) * item.quantity;
        });

        const shippingCharge = totalPrice > 100000 ? 0 : 5;

        const finalTotal = totalPrice + shippingCharge;
        const coupons = await Coupon.find({isActive : true})
        // console.log("availible coupons are : ",coupons);
        
         res.render('user/checkout', {
            addresses: userAddresses,
            cart,
            totalDiscount,
            shippingCharge,
            finalTotal,
            coupons
        })

    } catch (error) {
        console.error("Error from checkout page get", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

const getAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const userId = req.user._id;
        if (!userId) {
            return res.redirect('/login');
        }
        const userAddress = await Address.findOne(
            { userId, "address._id": addressId },  
            { "address.$": 1 }
        );

        if (!userAddress || userAddress.address.length === 0) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        return res.status(200).json({ success: true, data: userAddress.address[0] });


    } catch (error) {
        console.error("Error fetching address:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const orderSuccessPage = async (req, res) => {
    try {
        const { orderId } = req.params;
        // console.log(orderId)
        if(!orderId){
            res.status(404).send('error')
        }

        const order = await Order.findById(orderId)  
        .populate("items.product")  
      


        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found!" });
        }

        res.render("user/orderSuccess", { order });

    } catch (error) {
        console.error("Error from order success page:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};


const placeOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { addressId, paymentMethod, subtotal, discount, couponDiscount, shippingCharge, finalTotal } = req.body;
        console.log(paymentMethod);

        if (!addressId || !paymentMethod) {
            return res.status(400).json({ success: false, message: "Address and payment method are required!" });
        }

        const userAddress = await Address.findOne({ userId });
        if (!userAddress) {
            return res.status(400).json({ success: false, message: "User address not found!" });
        }

        const selectedAddress = userAddress.address.find(addr => addr._id.toString() === addressId);
        if (!selectedAddress) {
            return res.status(400).json({ success: false, message: "Selected address not found!" });
        }

        if (paymentMethod === "cash" && finalTotal > 2000) {
            return res.status(400).json({ success: false, message: "Cash on Delivery is not available for orders above ₹2000." });
        }

        const cart = await Cart.findOne({ userId }).populate("items.product");
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty!" });
        }

        for (const item of cart.items) {
            if (item.product.quantity < item.quantity) {
                return res.status(400).json({ success: false, message: `Not enough stock for ${item.product.productName}` });
            }
        }

      
    
        for (const item of cart.items) {
            item.product.quantity -= item.quantity;
            item.product.totalSold = (item.product.totalSold || 0) + item.quantity;
            await item.product.save();
        }

        const newOrder = new Order({
            userId,
            items: cart.items,
            totalAmount: finalTotal,
            subtotal,
            couponDiscount,
            discount,
            shippingCharge,
            address: selectedAddress,
            paymentMethod,
            paymentStatus: paymentMethod === "wallet" ? "Completed" : "Pending",
            orderStatus: "Processing",
            deliveryDate: new Date(new Date().setDate(new Date().getDate() + 5))
        });

        await newOrder.save();

        
        if (paymentMethod === "wallet") {
            const wallet = await Wallet.findOne({ userId });
            if (!wallet) {
                return res.status(400).json({ success: false, message: "Wallet not found!" });
            }

            if (wallet.balance < finalTotal) {
                return res.status(400).json({ success: false, message: "Insufficient wallet balance!" });
            }

          
            wallet.balance -= finalTotal;

          
            wallet.transactions.push({
                amount: finalTotal,
                type: "Debit",
                status: "Completed",
                orderId: newOrder.orderId
            });

            await wallet.save();
        }

        await Cart.findOneAndDelete({ userId });

            if (req.session.coupon && req.session.coupon.code) {
                await Coupon.findOneAndUpdate(
                    { code: req.session.coupon.code },
                    { $addToSet: { usedBy: userId } }
                );
            }

            req.session.coupon = null;


        return res.status(200).json({ success: true, message: "Order placed successfully", orderId: newOrder._id });

    } catch (error) {
        console.error("Error placing order:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};




const applyCoupon = async (req, res) => {
    try {
        const userId = req.user._id;
        const { code, cartTotal } = req.body;

        const coupon = await Coupon.findOne({ code, isActive: true });

        if (!coupon) {
            return res.status(400).json({ success: false, message: "Invalid or expired coupon." });
        }

        if (new Date() > coupon.expiryDate) {
            return res.status(400).json({ success: false, message: "Coupon has expired." });
        }
       

        if (coupon.usedBy.includes(userId)) {
            return res.status(400).json({ success: false, message: "You have already used this coupon." });
        }

        if (cartTotal < coupon.minPurchaseAmount) {
            return res.status(400).json({ 
                success: false, 
                message: `Minimum purchase of ₹${coupon.minPurchaseAmount} required to use this coupon.` 
            });
        }

        let discountAmount = (coupon.discount / 100) * cartTotal;

        if (discountAmount > coupon.maxDiscountAmount) {
            discountAmount = coupon.maxDiscountAmount;
        }

        const finalAmount = cartTotal - discountAmount;

        req.session.coupon = { code, discountAmount };

        res.status(200).json({
            success: true,
            message: `Coupon applied successfully! You saved ₹${discountAmount.toFixed(2)}`,
            discountAmount: discountAmount.toFixed(2),
            finalAmount: finalAmount.toFixed(2),
        });

    } catch (error) {
        console.error("Apply Coupon Error: ", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};



 const removeCoupon = async (req, res) => {
    try {
        const {cartTotal} = req.body
        const finalAmount = cartTotal + req.session.coupon.discountAmount;
        req.session.coupon = null
        res.status(200).json({ success: true, message: "Coupon removed successfully", finalAmount });
    } catch (error) {
        console.error("Remove Coupon Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const walletPlaceOrder = async(req,res)=>{
    try {

        console.log(req.body)
        
    } catch (error) {
        console.error("Error from wallet place order", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}





export default {
    getCheckOutPage,
    getAddress,
    orderSuccessPage,
    placeOrder,
    walletPlaceOrder,
    applyCoupon,
    removeCoupon
}