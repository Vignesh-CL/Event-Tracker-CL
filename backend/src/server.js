import 'dotenv/config';
import express from 'express'; import cors from 'cors'; import morgan from 'morgan'; import mongoose from 'mongoose';
import authRoutes from './routes/auth.js'; import eventRoutes from './routes/events.js'; import goodieRoutes from './routes/goodies.js'; import reportRoutes from './routes/reports.js';
const app = express(); app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' })); app.use(express.json()); app.use(morgan('dev'));
app.get('/api/health', (_, res) => res.json({ status: 'ok', service: 'office-event-tracker' })); app.use('/api/auth', authRoutes); app.use('/api/events', eventRoutes); app.use('/api/goodies', goodieRoutes); app.use('/api/reports', reportRoutes);
app.use((err, _req, res, _next) => { console.error(err); res.status(err.status || 500).json({ message: err.message || 'Server error' }); });
const port = process.env.PORT || 5000; mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/event_tracker').then(() => app.listen(port, () => console.log(`API running on http://localhost:${port}`))).catch((error) => { console.error('MongoDB connection failed:', error.message); process.exit(1); });
