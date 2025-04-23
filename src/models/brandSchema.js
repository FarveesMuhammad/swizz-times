import mongoose  from "mongoose";
import { Schema } from "mongoose";


const brandSchema = new mongoose.Schema({
    brandName:{
        type : String,
        required : true,
        unique : true
    },
    brandImage :{
        type : [String],
        required : true,
    },
    isBlocked : {
        type : Boolean,
        default : false,
    },
    isDeleted : {
        type : Boolean,
        default : false
    },
    createdAt : {
        type : Date,
        default : Date.now
    }
})

export const Brand = mongoose.model("Brand",brandSchema)
