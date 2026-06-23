const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/database');

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Updated CORS configuration - Allow both ports 3000 and 3001
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get('/', (req, res) => {
    res.json({ message: 'Server is running!' });
});

app.get('/api/test', (req, res) => {
    res.json({ message: 'API test route is working!' });
});

const authRoutes = require('./modules/authentication/authRoutes');
const apiVersion = process.env.API_VERSION || '/api/v1';
app.use(`${apiVersion}/auth`, authRoutes);

app.use((req, res) => {
    res.status(404).json({
        message: `Route ${req.method} ${req.originalUrl} not found`,
        availableRoutes: [
            'POST /api/v1/auth/login',
            'POST /api/v1/auth/register',
            'GET /api/v1/auth/verify',
            'POST /api/v1/auth/logout',
            'POST /api/v1/auth/forgot-password'
        ]
    });
});

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
});

const PORT = process.env.PORT || 5001;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`\n✅ Server running on http://localhost:${PORT}`);
            console.log(`🔐 Login endpoint: POST http://localhost:${PORT}${apiVersion}/auth/login\n`);
            console.log(`🌐 Allowed CORS origins: http://localhost:3000, http://localhost:3001`);
        });
    } catch (error) {
        console.error('Database connection failed:', error);
        app.listen(PORT, () => {
            console.log(`\n⚠️  Server running without database on http://localhost:${PORT}`);
            console.log(`🔐 Login endpoint: POST http://localhost:${PORT}${apiVersion}/auth/login\n`);
        });
    }
};

startServer();