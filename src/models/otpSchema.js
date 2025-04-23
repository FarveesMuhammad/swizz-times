import mongoose,{Schema} from "mongoose";
import { sendEmail } from "../utils/sentEmail.js";
const otpSchema = new Schema({
    email:{
        type:String,
        required:true,
    },
    otp:{
        type:String,
        required:true
    },
    type:{
      type:String
    },
    createdAt: {
      type: Date,
        default: Date.now,
        expires: 60*1,
      },
})

async function sendVerificationEmail(email, otp) {
    const title = "Verification Email"
      try {
        await sendEmail(
          email,
          title,
          otp
        );
        console.log("Email sent successfully:");
      } catch (error) {
        console.log("Error occurred while sending email: ", error);
        throw error;
      }
    }
    otpSchema.pre("save", async  function(next) {
      console.log("New document saved to the database");
     
      if (this.isNew) {
        await sendVerificationEmail(this.email, this.otp);
      }
      next();
    });
  export const Otp = mongoose.model('Otp',otpSchema)
