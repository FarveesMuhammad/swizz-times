import nodemailer from "nodemailer"
import env from "dotenv"
env.config()
const sendEmail = async(email,title,otp) => {
    try {
        
        const transporter = nodemailer.createTransport({
            host : process.env.MAIL_HOST,
            port : process.env.MAIL_PORT,
            secure : false,
            auth :{
                user : process.env.USER_EMAIL,
                pass : process.env.USER_PASS,
            },
            tls: {
                rejectUnauthorized : false,
            }
        })

        const info = await transporter.sendMail({
            from:process.env.USER_EMAIL,
            to:email,
            subject:title,
            html:`<b>Your OTP : ${otp}<b>`,
            text:`Your OTP is ${otp}`,
        })
        console.log("Email info: ",info)
        // return info.accepted.length >0

    } catch (error) {
        console.error("Error Sending email",error)
        return false;  
    }
}

export {sendEmail}