import mongoose from "mongoose";

const connectDB = async () => {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Mongo connected: ${conn.connection.host}`)
};

export default connectDB;