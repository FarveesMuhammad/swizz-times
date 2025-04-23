import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema(
  {
    orderId: {
      type: String,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        productName: { type: String },
        productImage: { type: String },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    address: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      houseNumber: { type: String, required: true },
      city: { type: String, required: true },
      district: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
      addressType: {
        type: String,
        enum: ["Home", "Work", "Other"],
        default: "Home",
      },
    },
    paymentMethod: { type: String, required: true },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed"],
      default: "Pending",
    },
    razorpayOrderId: {type : String},
    razorpay_payment_id: {type : String},
    razorpay_signature: {type : String},
    razorpayAmount : {type : String},
    paymentDetails: {
      failureReason: { type: String, default: null },
      succeededAt: { type: Date, default: null },
    },    
    orderStatus: {
      type: String,
      enum: ["Processing", "Shipped", "Delivered", "Cancelled", "Returned", "Return Pending", "Payment Pending"],
      default: "Processing",
    },
    returnReason: { type: String, default: null },
    returnStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", null],
      default: null,
    },
    deliveryDate: { type: Date, required: false },
  },
  { timestamps: true }
);


orderSchema.pre("save", async function (next) {
  if (!this.orderId) {
    try {
      
      const latestOrder = await mongoose.model("Order").findOne().sort({ createdAt: -1 });

      let nextOrderNumber = 1;
      if (latestOrder && latestOrder.orderId) {
        
        const lastOrderNumber = parseInt(latestOrder.orderId.split("-")[2], 10);
        nextOrderNumber = lastOrderNumber + 1;
      }

 const date = new Date().toISOString().split("T")[0].replace(/-/g, "")
       this.orderId = `ORD-${date}-${String(nextOrderNumber).padStart(4, "0")}`;
    } catch (error) {
      console.error("Error generating order ID:", error);
      return next(error);
    }
  }
  next();
});

export const Order = mongoose.model("Order", orderSchema);
