import express from "express";
import ejs from "ejs";
import path from "path";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import session from "express-session"
import connectDB from "./src/db/index.js";
import authRoutes from "./src/routes/authRoutes.js"
import adminRoutes from "./src/routes/adminRoutes.js"
import userRoutes from "./src/routes/userRoutes.js"
import cookieParser from "cookie-parser"
// import createDefaultAdmin from "./src/models/adminSchema.js";
import MongoStore from 'connect-mongo';
import passport from "passport";
import "./src/utils/passport.js";
import nocache from "nocache";


config()
const app = express()
const PORT = process.env.PORT 

 
// Fix for ES modules: Get the directory name dynamically
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// server&MONGODB
connectDB()
.then( ()=>{
    // await createDefaultAdmin()
    app.listen(PORT,()=>{
        console.log(`server is running on ${PORT}`)
    })
})
.catch(err=>{
    console.error('MongoDB error',err)
})

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(session({
    secret : process.env.SESSION_SECRET,
    resave : false,
    saveUninitialized : false,
    cookie:{
        secure : process.env.NODE_ENV === "production",
        httpOnly : true,
        maxAge : 48*60*60*60
    },
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI, 
        collectionName: "sessions", 
        ttl: 2 * 24 * 60 * 60 
    }),

}))
app.use(cookieParser());

// initialize passport and session
app.use(passport.initialize());
app.use(passport.session());



app.use(nocache());


//set EJS as view engine 
app.set('view engine','ejs')
app.set('views',[
    path.join(__dirname,'src','views'),
    path.join(__dirname,'src','views'),
])
//static files middleware
app.use(express.static(path.join(__dirname,"public")))


app.use('/',authRoutes)
app.use('/admin',adminRoutes)
app.use('/swizz-times',userRoutes)
   

app.use((req, res, next) => {
    res.status(404).render('error')
});


app.use((err, req, res, next) => {
    console.error("Error:", err.stack);

    if (req.accepts('html')) {
        res.status(err.status || 500).render('error')
    } else {  
        res.status(err.status || 500).json({
            success: false,
            message: err.message || "Internal Server Error"
        });
    }
});
