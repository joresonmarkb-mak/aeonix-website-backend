import dotenv from 'dotenv'
import connectDB from './config/database.js'
import app from './app.js'

dotenv.config();

const startServer = async () => {
    try {
        await connectDB();
        app.listen(process.env.PORT || 5000, () => {
            console.log(`Server running on port ${process.env.PORT || 5000}`)
        });
    } catch (error) {
        console.log('MongoDB connection failed',error)
        
    }
    
}

startServer();