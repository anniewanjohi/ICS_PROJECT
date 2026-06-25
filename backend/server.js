// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/database');

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'SU Directory API running', version: process.env.API_VERSION });
});

// Routes
const authRoutes = require('./modules/authentication/authRoutes');
const directoryRoutes = require('./modules/directory/directoryRoutes');
const appointmentRoutes = require('./modules/appointments/appointmentRoutes');
const notificationRoutes = require('./modules/notifications/notificationRoutes');
const staffRoutes = require('./modules/staff/staffRoutes');
const adminRoutes = require('./modules/admin/adminRoutes');

const API = process.env.API_VERSION || '/api/v1';

app.use(`${API}/auth`, authRoutes);
app.use(`${API}/directory`, directoryRoutes);
app.use(`${API}/appointments`, appointmentRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/staff`, staffRoutes);
app.use(`${API}/admin`, adminRoutes);

// 404
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`\n✅ Server running on http://localhost:${PORT}`);
            console.log(`📋 Routes available at http://localhost:${PORT}${API}/`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
