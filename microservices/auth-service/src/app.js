const express = require('express');

const app = express();

// Status endpoint
app.get('/status', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Auth Service is running on port ${PORT}`);
});