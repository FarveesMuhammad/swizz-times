import mongoose  from "mongoose";
import { Schema } from "mongoose";



const productSchema = new mongoose.Schema({
    productName : {
        type : String,
        required : true,
    },
    description : {
        type : String,
        required : true,
    },
    category : {
        type:mongoose.Schema.Types.ObjectId,
        ref : "Category",
        required : true,
    },
    brand : {
        type:mongoose.Schema.Types.ObjectId,
        required : true,
    },
    regularPrice : {
        type : Number,
        required : true,
    },
    salePrice : {
        type : Number,
        required : true
    },
    productImage : {
        type : [String],
        required : true
    },
    quantity : {
        type : Number,
        default : 0
    },
    totalSold: {
        type: Number,
        default: 0
      },
    productOffer : {
        type : Number,
        default : 0
    },
    isBlocked : {
        type : Boolean,
        default : false
    },
    status : {
        type : String,
        enum : ["Available","out of stock"],
        required : true,
        default : "Available"
    },
    case_material : {
        type : String,
        required : true,
    },
    band_material : {
        type : String,
        required : true,
    },
    clasp_type : {
        type : String,
        required : true,
    },
    country : {
        type : String,
        required : true
    },
    water_resistance : {
        type : Boolean,
        required : true
    },
    ratings: { type: Number, default: 0 }, // Average rating
    reviews: [
        {
            name: { type: String, required: true },
            email: { type: String, required: true },
            rating: { type: Number, required: true, min: 1, max: 5 },
            review: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }
    ]
},{timestamps : true})

export const Product = mongoose.model("Product",productSchema)