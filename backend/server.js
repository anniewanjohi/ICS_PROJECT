// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();


const app = express();

// Body parser - IMPORTANT: This must be before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

// Simple test route at root
app.get('/', (req, res) => {
    res.json({ message: 'Server is running!' });
});

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'API test route is working!' });
});


// Import route modules
const authRoutes = require('./modules/authentication/authRoutes');

// Initialize express app
//const app = express();


// Request logging middleware (for debugging)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ============ ROUTES ============

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// API version prefix
const apiVersion = '/api/v1';

// Authentication routes
app.use(`${apiVersion}/auth`, authRoutes);

// 404 handler for undefined routes - FIXED (removed '*')
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Cannot ${req.method} ${req.originalUrl} - Route not found`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({
        success: false,
        message: 'An unexpected error occurred',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============ START SERVER ============

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`\n=================================`);
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}${apiVersion}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Auth routes mounted at ${apiVersion}/auth`);
    console.log(`=================================\n`);
});