import mongoose  from "mongoose";
import { Schema } from "mongoose";


const categorySchema = new mongoose.Schema({
    name:{
        type : String,
        required : true,
        unique : true
    },
    description :{
        type : String,
        required : true,
    },
    offer: { 
        type: Number, 
        default: 0,  
        min: 0,
        max: 100 
    },

    isDeleted : {
        type : Boolean,
        default : false,
    }
},{timestamps : true})

export const Category = mongoose.model("Category",categorySchema)
