import mongoose,{Schema} from 'mongoose'

const wishlistSchema = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    items:[{
       product:{
        type:Schema.Types.ObjectId,
        ref:"Product",
        required:true
       },
       quantity:{
        type:Number,
        required:true,
        min:1,
        default:1
       }
    }]
},{timestamps:true})

export const Wishlist = mongoose.model('Wishlist',wishlistSchema)