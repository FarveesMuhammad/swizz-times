import mongoose from "mongoose"
import { v4 as uuidv4 } from "uuid"

const userSchema = new mongoose.Schema({
    fullname:{
        type : String,
        required : true,
    },
    email:{
        type : String,
        required : true,
        trim : true
    },
    username:{
        type : String,
        required : true,
        unique : true,
        trim : true
    },
    mobile : {
        type : Number,
        unique : true,
    },
    dob : {
        type : String
    },
    profilePicture :{
        type : [String],
        required : true,
    },
    password:{
        type : String,
        required : true
    },
    googleId:{
        type : String,
        unique : true,
        sparse : true
    },
    referralCode: { type: String, unique: true }, 
    referredBy: { type: String, default: null },
    isBlocked:{
        type : Boolean,
        default : false
    }
},{timestamps : true})

userSchema.pre("save", function (next) {
    if (!this.referralCode) {
        this.referralCode = `SWIZZ-${uuidv4().slice(0, 8).toUpperCase()}`
    }
    next();
});

export const User = mongoose.model("User",userSchema)
