const http = require('http');

const postData = JSON.stringify({
    email: 'testuser@example.com',
    password: '123456'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/auth/login',  // Changed from /api/auth/login to /api/v1/auth/login
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response:', data);
    });
});

req.on('error', (error) => {
    console.error('Error:', error.message);
});

req.write(postData);
req.end();