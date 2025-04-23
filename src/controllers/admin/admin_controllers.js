import Admin from "../../models/adminSchema.js"
import bcrypt from "bcrypt"

const loginGet = (req,res)=>{
    try {

        res.render('admin/adminLogin')
        
    } catch (error) {
        console.error("Error from admin login get", error.message)
        res.status(500).json({ error : "Internal server error"})
    }
}


const login = async (req,res) =>{
    try {
        const {email , password} = req.body
        const admin = await Admin.findOne({ email:"admin@gmail.com"})
       
        if(email !== admin.email){
        
            return res.status(401).json({success : false , message : "Invalid admin email"})
        }
        const isPass = await bcrypt.compare(password,admin.password)
    
        if(!isPass){

            return res.status(401).json({success : false , message : "Wrong password"})
            
        }
        req.session.admin = admin

        return res.status(200).json({success:true})
       
    } catch (error) {
        console.error("Error from admin login post", error.message)
        res.status(500).json({error : "Internal server error"})
    }
}


const logoutAdmin = (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error("Error destroying admin session:", err.message);
                return res.status(500).json({ error: "Internal server error" });
            }
            res.redirect('/admin/login');
        });
    } catch (error) {
        console.error("Error from admin logout", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};









export {
    loginGet,
    login,
    logoutAdmin
    
    
}