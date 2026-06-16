const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/database');

// Load env vars
dotenv.config();

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

// Import routes - FIXED PATHS
const authRoutes = require('./modules/authentication/authRoutes');

// Use routes - Make sure this is after body parser
app.use(`${process.env.API_VERSION}/auth`, authRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        message: `Route ${req.method} ${req.originalUrl} not found`,
       availableRoutes: [
          'GET /',
           'GET /api/test',
           'POST /api/v1/auth/login',
           'GET /api/v1/auth/me',
           'POST /api/v1/auth/register'
      ]
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
});

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`\n✅ Server running on http://localhost:${PORT}`);
            console.log(`🔐 Login endpoint: POST http://localhost:${PORT}/api/auth/login\n`);
        });
    } catch (error) {
        console.error('Database connection failed:', error);
        // Start server even without database for testing
        app.listen(PORT, () => {
            console.log(`\n⚠️  Server running without database on http://localhost:${PORT}`);
            console.log(`🔐 Login endpoint: POST http://localhost:${PORT}${process.env.API_VERSION}/auth/login`
);
        });
    }
};
startServer();