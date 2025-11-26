/**
 * BitWishNetwork Mining System
 * Backend Server Entry Point
 */

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import miningRoutes from './routes/mining';
import userRoutes from './routes/user';
import adminRoutes from './routes/admin';
import attendanceRoutes from './routes/attendance';

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bitwish_mining';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/mining', miningRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/attendance', attendanceRoutes);

// MongoDB Connection
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB Hybrid Storage');

        // Start Server
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB Connection Error:', err);
    });

export default app;
