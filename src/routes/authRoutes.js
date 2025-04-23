import express from "express"
import passport from "../utils/passport.js"
import { getLogin,
        getSignup,
        Login,
        Signup,
        verifyOtp,
        verifyOtpGet,
        forgotPasswordGet,
        forgotPassword,
        changePasswordGet,
        newPassword,
        resendOtp,
        logout } from "../controllers/user/authController.js"

import {preventAuthUserAccess} from "../middlewares/userAuth.js"
import jwt from "jsonwebtoken"
const router = express.Router()



router.get('/login',preventAuthUserAccess,getLogin)
router.post('/login',Login)
router.get('/signup',preventAuthUserAccess,getSignup)
router.post('/signup',Signup)
router.get('/verify-otp',preventAuthUserAccess,verifyOtpGet)
router.post('/verify-otp',verifyOtp)

router.get('/forgot-password',preventAuthUserAccess,forgotPasswordGet)
router.post('/forgot-password',forgotPassword)
router.get('/changePassword',preventAuthUserAccess,changePasswordGet)
router.post('/changePassword',newPassword)
router.post('/resend-otp',resendOtp)
router.get('/logout',logout)


router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));


 router.get('/auth/google/callback',
        passport.authenticate('google', { failureRedirect: '/login' }),
        (req, res) => {
    
            if (!req.user) {
                console.error("Google OAuth failed: No user found");
                return res.redirect('/signup');
            }else if(req.user.googleId)
    
            req.session.user = req.user._id;
    
            req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    return res.redirect('/signup');
                }
            });
    
            
            const token = jwt.sign({ id: req.user._id }, process.env.JWT_KEY, {
                 expiresIn: "7d" 
            });
     
    
            res.cookie('authToken', token, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000
            });
    
            console.log("Google signup done");
    
 
        res.redirect("/swizz-times"); 
    }
);
 

export default router