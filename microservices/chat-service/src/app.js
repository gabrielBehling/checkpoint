const express = require('express');

const app = express();

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Chat Service is running'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Chat Service is running on port ${PORT}`);
});