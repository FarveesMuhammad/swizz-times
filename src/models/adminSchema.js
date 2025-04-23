import mongoose from "mongoose";
import bcrypt from "bcrypt"

const adminSchema = new mongoose.Schema({
    email : {
        type : String ,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        default : "admin@gmail.com",
    },
    password: {
        type: String,
        required: true,
    },
});


adminSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

 const Admin = mongoose.model("Admin", adminSchema);
 



const createDefaultAdmin = async () => {
    const existingAdmin = await Admin.findOne({ email: "admin@gmail.com" });

    if (!existingAdmin) {
        await Admin.create({ email: "admin@gmail.com", password: "Admin@123"});
        console.log(" Default admin created!");
    }
};

createDefaultAdmin();

export default Admin;