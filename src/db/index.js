import mongoose from "mongoose";
import {DB_NAME} from "../../constants.js"

const connectDB = async()=>{
    try{
        const connection = await mongoose.connect(`${process.env.MONGO_URI}`)
        console.log(`MongoDB is connected at ${connection.connection.host}`)
        console.log(`MongoDB is connected at ${connection.connection.db}`)
        console.log(`MongoDB is connected at ${connection.connection.name}`)
    }catch (error){
        console.error(`error connecting mongoDB`,error)
        process.exit(1)
    }
}

export default connectDB 