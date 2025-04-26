import mongoose from 'mongoose';
import 'dotenv/config.js'
import {DB_NAME} from '../config/constant.js';

const connectDB = async () => {
    try {
        const connectionInstantiate = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        console.log(`${connectionInstantiate.connection.name} Connected!`);
    } catch (error) {
        console.log("Error connecting to MongoDB", error.message);
    }
}

export default connectDB;