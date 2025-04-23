import { User } from "../../models/userSchema.js";
import { Otp } from "../../models/otpSchema.js"
import { Address } from "../../models/addressSchema.js";
import bcrypt from "bcrypt"

const userDetailsGet = async(req,res) =>{
    try {

        const user = req.user
        if (!user) {
            return res.redirect('/login');
        }

        const userAddress = await Address.findOne({userId : user._id})  

        res.render("user/userDetails",{user, address: userAddress ? userAddress.address : [] })
        
    } catch (error) {
        console.error("Error in userDetailsGet:", error.message);
        res.status(500).send("Internal Server Error");
    }
}

const editUserDetailsPage = async(req,res) =>{
    try {

        const user = req.user
        if (!user) {
            return res.redirect('/login');
        }
        res.render("user/editUser",{user})
        
    } catch (error) {
        console.error("Error in edituserDetailsGet:", error.message);
        res.status(500).send("Internal Server Error");
    }
}



function generateOtp(){
    return Math.floor(1000 + Math.random() * 9000)
}




const editUserDetails = async(req,res) =>{
    try {
        
        const user = req.user
        if (!user) {
            return res.redirect('/login');
        }
        const {profilePicture,fullname,email,mobile,dob} = req.body
        
        if(profilePicture){
            user.profilePicture = profilePicture
            await user.save()

           return res.status(200).json({success : true, message : "profile pic uploaded"})
        }

        if(fullname){

            user.fullname = fullname
            await user.save()
            return res.status(200).json({success : true, message : "Fullname updated"}) 

        }
        if(email){

            const recordedEmail = await User.findOne({email})
            if(recordedEmail){

                return res.status(500).json({success : false , message:"User with this email already exist"})
            }
            const otp = generateOtp()
            console.log("Otp from edit profile email : ",otp)
            await Otp.create({email,otp})

            req.session.userEmail = email
            req.session.user = user
            
            return res.status(200).json({success : true , message : "otp sent successfully"})
            
        }
        if(mobile){
            user.mobile = mobile
            await user.save()
            return res.status(200).json({success : true, message : "Mobile updated"}) 
        }
        if(dob){
            user.dob = dob

            await user.save()
            return res.status(200).json({success : true, message : "Date of Birth updated"}) 
        }


    } catch (error) {
        console.error("Error in edituserDetailspost:", error.message);
        res.status(500).send("Internal Server Error");
        
    }
}

const verifyOtp = async(req,res) =>{
    try {
        const {otp} = req.body
        const email = req.session.userEmail

        if(!email){
            return res.json({success : false, message : "Session expired, please try again later"})
        }
        const recordedOtp = await Otp.findOne({email})
        if(!recordedOtp){

            return res.json({success : false, message : "Otp invalid"})

        }
        if(otp.toString() !== recordedOtp.otp.toString()){

            return res.json({success : false , message : "Otp do not match"})

        }
        const user = await User.findById(req.session.user._id)
        if (!user) {

            return res.json({ success: false, message: "User not found" })

        }
        user.email = email
             await user.save()
             await Otp.deleteOne({email})
            return res.status(200).json({success : true, message : "Email updated"}) 


    } catch (error) {
        console.error("Error in user email verrify otp post:", error.message);
        res.status(500).send("Internal Server Error");
    }
}
const verifyOtpPage = (req,res) =>{
    try {
        
        res.render('user/updateEmailOtp')

    } catch (error) {
        console.error("Error in verify otp user email get :", error.message);
        res.status(500).send("Internal Server Error");
    }
}

const emailResendOtp = async (req, res) => {
    try {
        const email = req.session.userEmail

        if (!email) {
            return res.json({ success: false, message: "Session expired, please try again." })
        }
        await Otp.deleteOne({email})

       
        const otp = generateOtp();
        console.log("Resent OTP is:", otp)
     
        await Otp.create({ email, otp })


        return res.json({ success: true, message: "OTP resent successfully." })

    } catch (error) {
        console.error("Error resending OTP:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" })
    }
};

 const changePassword = async (req,res) =>{
    try {
        
       
        const {currentPassword,newPassword,confirmPassword} = req.body
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({success : false , message : "Every field must be filled"})
        }
      
        
        const user = await User.findById(req.user._id)

        if (!user) {

            return res.status(404).json({ success: false, message: "User not found" })
            
        }
     
        const passwordCheck = await bcrypt.compare(currentPassword , user.password)
        if(!passwordCheck){
            return res.status(400).json({success : false , message : "Password given is not valid"})        
        }
        if(newPassword.length < 6){
            return res.status(400).json({success : false , message : "Password must be atleast 6"})        }
            if(newPassword !== confirmPassword){
                return res.status(400).json({success : false , message : "password do not match"})
            }
           
            const hashedPassword = await bcrypt.hash(newPassword,10)
            user.password = hashedPassword
            await user.save()
        
        res.status(200).json({ success: true, message: "Password changed successfully!" });
        
    } catch (error) {
        console.error("Error from user change password:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
 }


const showUserAddresses = async(req,res) =>{
    try {
        const userId = req.user._id
        if (!userId) {
            return res.redirect('/login');
        }
        const address = await Address.findOne({userId})
        if (!address || address.address.length === 0) {
            return res.render('user/addresses', { addresses: [] }); 
        }
        res.render('user/addresses',{addresses : address.address})
        
    } catch (error) {
        console.error("Error from show user address page:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}



const addAddress = async (req, res) => {
    try {
        const { fullName, phone, houseNumber, city, district, state, zipCode, country, addressType, isDefault } = req.body;
        const userId = req.user; 
        
        if (!fullName || !phone || !houseNumber || !city || !district || !state || !zipCode || !country || !addressType) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

      
        let userAddress = await Address.findOne({ userId });

        if (!userAddress) {
           
            userAddress = new Address({
                userId,
                address: [{
                    fullName, phone, houseNumber, city, district, state, zipCode, country, addressType,
                    isDefault: true 
                }]
            });
        } else {
            if (isDefault) {

                userAddress.address.forEach(addr => addr.isDefault = false);
            }

            userAddress.address.push({
                fullName, phone, houseNumber, city, district, state, zipCode, country, addressType, isDefault
            });
        }
        await userAddress.save();

        return res.status(200).json({
            success: true,
            message: "Address added successfully",
        });

    } catch (error) {
        console.error("Error from addAddress:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" })
    }
};

const updateAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const userId = req.user._id;
        const updateData = req.body;
        console.log("updated data --===============================",updateData);
    
        if (!updateData.fullName || !updateData.phone || !updateData.houseNumber || !updateData.city || !updateData.state || !updateData.zipCode || !updateData.country) {
            return res.status(400).json({ success: false, message: "All fields are required!" });
        }

        const updatedUser = await Address.findOneAndUpdate(
            { userId, "address._id": addressId },
            { $set: { "address.$": updateData } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }
        if (!updateData.fullName.match(/^[a-zA-Z\s]+$/)) {
            return res.status(400).json({ success: false, message: "Full name should contain only letters and spaces" });
        }
        if (!updateData.phone.match(/^\d{10,12}$/)) {
            return res.status(400).json({ success: false, message: "Invalid phone number format" });
        }
        if (!updateData.zipCode.match(/^\d{5,6}$/)) {
            return res.status(400).json({ success: false, message: "Invalid ZIP code format" });
        }
        return res.status(200).json({ success: true, message: "Address updated successfully" })

    } catch (error) {
        console.error("Error updating address:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};


const removeAddress = async(req,res) =>{
    try {

        const {addressId} = req.params
        const userId = req.user._id
        
        
        const userAddress = await Address.findOne(
            { userId, "address._id": addressId }, 
            { "address.$": 1 }
        );     
        if(!userAddress){

            return res.status(404).json({success : false , message : "address doesnt exists"})
            
        }   
        const isDefault = userAddress.address.find(addr => addr._id.toString() === addressId)?.isDefault;
        
        await Address.updateOne(
            { userId },
            { $pull: { address: { _id: addressId } } }
        );
        if (isDefault) {
            const updatedUserAddress = await Address.findOne({ userId });

            if (updatedUserAddress && updatedUserAddress.address.length > 0) {
                updatedUserAddress.address[0].isDefault = true;
                await updatedUserAddress.save();
            }
        }

        

        res.status(200).json({success : true , message :"Address removed successfully"})
        
    } catch (error) {
        console.error("Error from delete address:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

// const updateAddress = async (req, res) => {
//     try {
//         const { addressId } = req.params;
//         const userId = req.user._id;
//         const updateData = req.body;

//         // Validate required fields
//         if (!updateData.fullName || !updateData.phone || !updateData.houseNumber || !updateData.city || !updateData.state || !updateData.zipCode || !updateData.country) {
//             return res.status(400).json({ success: false, message: "All fields are required!" });
//         }

//         // Find and update the specific address
//         const updatedUser = await Address.findOneAndUpdate(
//             { userId, "address._id": addressId },
//             { $set: { "address.$": updateData } },
//             { new: true }
//         );

//         if (!updatedUser) {
//             return res.status(404).json({ success: false, message: "Address not found" });
//         }

//         return res.status(200).json({ success: true, message: "Address updated successfully" });

//     } catch (error) {
//         console.error("Error updating address:", error.message);
//         return res.status(500).json({ success: false, message: "Internal server error" });
//     }
// };



const setDefaultAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const userId = req.user._id;

        console.log(userId)
        const userAddress = await Address.findOne({ userId });

        if (!userAddress) {
            return res.status(404).json({ success: false, message: "No addresses found" });
        }
        const addressExists = userAddress.address.some(addr => addr._id.toString() === addressId);
        if (!addressExists) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        userAddress.address.forEach(addr => (addr.isDefault = false));

        const defaultAddress = userAddress.address.find(addr => addr._id.toString() === addressId);
        defaultAddress.isDefault = true;

        await userAddress.save();

        return res.status(200).json({ success: true, message: "Default address updated" });

    } catch (error) {
        console.error("Error setting default address:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};



export default {
    userDetailsGet,
    editUserDetailsPage,
    editUserDetails,
    verifyOtp,
    verifyOtpPage,
    emailResendOtp,
    changePassword,
    showUserAddresses,
    addAddress,
    removeAddress,
    updateAddress,
    setDefaultAddress
}