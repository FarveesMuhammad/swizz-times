import mongoose,{Schema} from "mongoose"

const addressSchema = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    address:[{
          fullName:{type:String,required:true},
          phone:{type:String,required:true},
          houseNumber:{type:String,required:true},
          city:{type:String,required:true},
          district:{type:String,required:true},
          state:{type:String,required:true},
          zipCode:{type:String,required:true},
          country:{type:String,required:true},
          addressType: {type: String,enum: ['Home', 'Work', 'Other'],default: 'Home'},
          isDefault:{type:Boolean,default:false}
    }]

},{timestamps : true})

export const Address = mongoose.model("Address",addressSchema)