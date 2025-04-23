import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import {User} from "../../models/userSchema.js"
import { Otp } from "../../models/otpSchema.js"
import { Coupon } from "../../models/couponSchema.js"

const getLogin = (req,res)=>{
    try {

        res.render('user/userLogin')
        
    } catch (error) {
        console.error("error from user login page get",error.message)
        return res.status(500).json({success : false , error : error.message})
    }
}

const Login= async (req,res)=>{ 
    try{
        const {email,password}  = req.body
        const existingUser = await User.findOne({email}) 
        // console.log("existing" , existingUser)
        
        if(!existingUser){
            return res.json({success : false , message : "No Account with this email found"})
        }
        const hash = existingUser.password
        const pass = await bcrypt.compare(password,hash)
        if(!pass){
            return res.json({success : false , message : "Incorrect Password"})
        }
        // console.log("existing  iddddd" , existingUser._id)
    
        // const token = jwt.sign({userId : existingUser._id},process.env.JWT_KEY,{expiresIn : "24h"})
          const token = jwt.sign({ id: existingUser._id }, process.env.JWT_KEY, {
                         expiresIn: "7d" 
                    });
             
        
        res.cookie('authToken', token, {
            httpOnly: true,  
            maxAge: 24 * 60 * 60 * 1000 
        });



        return res.json({success : true})

    }catch(error){
        console.error("error from user login page post",error.message)
        return res.status(500).json({success : false , error : error.message})
    }
} 

const getSignup=(req,res)=>{
    try {

        res.render('user/userSignup',{error:null})
        
    } catch (error) {

        console.error("error from user signup page get",error.message)
        return res.status(500).json({success : false , error : error.message})

    }
}

// ===========================function for generating otp==================================
function generateOtp(){
    return Math.floor(1000 + Math.random() * 9000)
}
 

// ==================================Signup Post===========================================
const Signup=async (req,res)=>{
    try{
    const {fullname,email,username,password,confirmPassword, referralCode} = req.body
    if(!fullname || !email || !username || !password || !confirmPassword){
        return res.render('user/userSignup',{error:"All fields are required"})
    }
    if(password.length < 6){
        return res.render('user/userSignup',{error : "password must be atleast 6"})
    }
    if(password !== confirmPassword){
        return res.render('user/userSignup',{error:'password do not match'})
    }

    const existingUser = await User.findOne({ $or: [ { email } , { username } ]})
    if(existingUser){
        if(existingUser.email === email){
            return res.render('user/userSignup',{error:"User with this email already exist"})
        }
        if(existingUser.username === username){
            return res.render('user/userSignup',{error:"Username already taken"})
        }
    }

        const otp = generateOtp()
        console.log("signup otp is",otp)

        await Otp.create({ email, otp });

        req.session.userDetails = { fullname, email, username, referralCode  };
        req.session.tempPassword = await bcrypt.hash(password,10)
      

        return res.redirect('/verify-otp')
    

    }catch(error){
        console.error("error from signup post",error.message)
        return res.status(500).json({success:false,error: error.message})
    }
}

// ==================================Verify otp get===========================================
const verifyOtpGet = (req,res)=>{
    const email = req.session.userDetails?.email || ""
    // console.log(email)
    res.render('user/otpVerification',{text:email})
}

// ==================================Verify otp Post===========================================
const verifyOtp = async (req,res)=>{
    try{
    const {otp} =req.body
    const email = req.session.userDetails?.email 

    if(!email){
        return res.json({success : false, message : "Session expired, please try again later"})
    }
    
    const recordedOtp = await Otp.findOne({ email }) 
    // console.log(recordedOtp.type)
    
    if(!recordedOtp){
        return res.json({success : false, message : "Otp invalid"})
    }

// ====================================forgot password otp================================================
    if(recordedOtp.type == "Forget_Password"){
        
        if(otp.toString() !== recordedOtp.otp.toString()){
            return res.json({success : false , message : "Otp do not match"})
            
        }

        return res.json({success : true , message : "OTP verified successfully" , forgotPassword : true})

//  ====================================signup page otp================================================

    }else{

        if (otp.toString() !== recordedOtp.otp.toString()) {
            return res.json({ success: false, message: "OTP does not match" });
        }
        
        const { username, fullname, referralCode } = req.session.userDetails;
                // console.log("referralcode",referralCode)
        const hashedPassword = req.session.tempPassword;
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
            return res.json({ success: false, message: "User already exists" });
        }
        
        
        let referredBy = null;
        
        if (referralCode) {
            
            const referrer = await User.findOne({ referralCode });
        
            if (referrer) {
                referredBy = referrer.referralCode; 
        
            //   console.log(1)
                const rewardCoupon = new Coupon({
                    code: `REF-${referrer._id.toString().slice(-6)}`,
                    discount: 10, 
                    minPurchaseAmount: 500,
                    maxDiscountAmount: 100,
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    isActive: true,
                    userId: referrer._id,
                });
                // console.log(rewardCoupon)
                await rewardCoupon.save();
            }
        }
        
       
        const newUser = new User({
            fullname,
            email,
            username,
            password: hashedPassword,
            referredBy,
        });
        
        await newUser.save();
        
        req.session.user = newUser._id;
        
       
        await Otp.deleteOne({ email });
        
     
        delete req.session.tempPassword;
        delete req.session.userDetails;
        
        return res.json({ success: true, message: "OTP verified successfully" });
        
}
}catch(error){
    console.error("error from otp verification",error.message)
    res.status(500).json({success : false , error:error.message})
    }
    
} 





const forgotPasswordGet = (req,res) =>{

    res.render('user/forgotPassword')
}

const forgotPassword = async (req, res) => {
    try {
         const { email } = req.body;
        req.session.userDetails = {email}
        const otp = generateOtp();
        console.log("Forgot password otp",otp)
        const type = "Forget_Password"
        await Otp.create({ email, otp, type })
        req.session.type = type

        return res.redirect('/verify-otp');
    } catch (error) {
            console.error('Error from forgot password:', error.message);
            return res.status(500).json({ error: "Internal Server Error" });
    }
};

const changePasswordGet = (req,res)=>{
    try {
        
        if (!req.session.userDetails || !req.session.userDetails.email) {
            return res.redirect('/forgot-password'); 
        }
        res.render('user/changePassword', { userEmail: req.session.userDetails.email });
        
    } catch (error) {
        console.error('Error from change password:', error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

const newPassword = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.findOneAndUpdate(
            { email },
            { password: hashedPassword },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        console.error('Error from new password:', error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


const resendOtp = async (req, res) => {
    try {
        const email = req.session.userDetails?.email;

        if (!email) {
            return res.json({ success: false, message: "Session expired, please try again." });
        }

        await Otp.deleteOne({email})
        const otp = generateOtp();
        console.log("Resent OTP is:", otp);

      console.log(req.session.type)
      let type = req.session.type
        await Otp.findOneAndUpdate(
            { email },
            { otp },
            {type : req.session.type},
            { upsert: true, new: true }
        );

     
        await Otp.create({ email, otp });

        return res.json({ success: true, message: "OTP resent successfully." });

    } catch (error) {
        console.error("Error resending OTP:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const logout = (req,res) =>{
    try {
        res.clearCookie("authToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
        });

        return res.redirect('/login')

    } catch (error) {
        console.error("Error from user logout:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}




export {getLogin,
        getSignup,
        Login,
        Signup,
        verifyOtpGet,
        verifyOtp,
        forgotPasswordGet,
        forgotPassword,
        changePasswordGet,
        resendOtp,
        logout,
        newPassword}