import {User} from "../models/userSchema.js"
import Admin from "../models/adminSchema.js"
import jwt from "jsonwebtoken"


const verifyUserToken = async(req,res,next) =>{
    const token = req.cookies?.authToken
    if (!token) {
        
      return res.redirect('/login')
    }
    try {

        const decoded = jwt.verify(token, process.env.JWT_KEY);    
        const user = await User.findById(decoded.id);

        // console.log("decoded ===",decoded)
        // console.log("user ===",user)
        if (!user) {
            res.clearCookie("authToken");
            return res.redirect('/login');  
        }
        if (user.isBlocked) {
            res.clearCookie("authToken");
            return res.redirect("/login");
        }
        
        

        req.userId = decoded.userId;
        // req.userId = user._id;
        req.user = user
        // console.log(req.user)
        next();

    } catch (error) {
        console.error("Error from verify token middleware:", error.message);
        res.clearCookie("authToken");  
        return res.redirect('/login');
    }
    
}

const preventAuthUserAccess  = (req,res,next) =>{
    try {
        const token = req.cookies?.authToken
        if(token){
            return res.redirect('/swizz-times')
        }else{
            next()
        }
    } catch (error) {
        console.error("Error in preventAuthUserAccess middleware:", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}


// ==============================admin middlewares=============================================

const verifyAdminSession = async(req,res,next)=>{
    try {
        if(req.session?.admin){
           await Admin.findById(req.session.admin)
            .then(data =>{
                if(data){
                    next()
                }else{
                    res.redirect("/admin/login")
                }    
            })    
            .catch(error =>{
                console.error("Error from admin authentication middleware",error.message)
                res.status(500).json({error : "Internal server error"})
            })    
        }else{
            return res.redirect('/admin/login')
        }    
    } catch (error) {
        console.error("Error in verifyAdminSession middleware:", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}    

const preventAuthAdminAccess = (req,res,next) =>{
    const admin = req.session?.admin
    try {
        if(!admin){
            next()
        }else{
            return res.redirect("/admin/dashboard")
        }
    } catch (error) {
        console.error("Error in preventAuthAdminAccess middleware:", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}



export {
    verifyUserToken,
    verifyAdminSession,
    preventAuthUserAccess ,
    preventAuthAdminAccess
}