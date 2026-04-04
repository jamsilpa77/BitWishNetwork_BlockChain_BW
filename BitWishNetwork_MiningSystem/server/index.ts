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
import referralRoutes from './routes/referral';
import statsRoutes from './routes/stats';

import { BitWishBlockchain } from '../../BitWishNetwork_BlockChain/src/engine/BitWishBlockchain';

// 백엔드 프로세스 내부에 전역(Singleton) 코어 엔진을 결합 구동
export const bwChainCore = new BitWishBlockchain();

// 서버 구동 시 딱 한 번 제네시스 설정만 마침 (JSON 파일을 강제로 뜯어고치지 않음)
bwChainCore.initialize().then(() => {
    console.log("🚀 [Phase 4 융합] 백엔드 내부에 블록체인 코어 엔진 무결점 대기 완료");
});

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
app.use('/api/referral', referralRoutes);
app.use('/api/stats', statsRoutes);

// MongoDB Connection
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB Hybrid Storage');

        // Start Server
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`🔄 Server restarted at ${new Date().toLocaleString()}`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB Connection Error:', err);
    });

export default app;
