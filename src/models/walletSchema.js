import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const walletSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, 
    },
    balance: {
      type: Number,
      required: true,
      default: 0.0, 
    },
    transactions: [
      {
        transactionId: {
          type: String,
          default: uuidv4, 
          required: true,
        },
        amount: { type: Number, required: true },
        type: {
          type: String,
          enum: ["Credit", "Debit"],
          required: true,
        },
        status: {
          type: String,
          enum: ["Completed", "Pending", "Failed"],
          default: "Pending",
        },
        orderId: {
          type: String,
          default: null
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

export const Wallet = mongoose.model("Wallet", walletSchema, "wallet")
