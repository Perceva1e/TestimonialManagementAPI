require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;

if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing.");
    process.exit(1);
}

if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing.");
    process.exit(1);
}

if (!process.env.PORT) {
    console.error("PORT is missing.");
    process.exit(1);
}

async function startServer() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Successfully connected to MongoDB.');
        const server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
        process.on('SIGINT', async () => {
            console.log('Shutting down...');
            await mongoose.connection.close();
            server.close(() => {
                console.log('Server stopped.');
                process.exit(0);
            });

        });
        process.on('SIGTERM', async () => {
            await mongoose.connection.close();
            server.close(() => process.exit(0));
        });
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
}   
startServer();