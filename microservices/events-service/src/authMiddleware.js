const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;

async function authMiddleware(req, res, next) {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
        // Use standardized response if available, otherwise fallback
        if (typeof res.error === 'function') {
            return res.error('Access token missing', 'UNAUTHORIZED', 401);
        }
        return res.status(401).json({ message: 'Access token missing' });
    }

    try {
        const user = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
        req.user = user;
        return next();
    } catch (err) {
        if (typeof res.error === 'function') {
            return res.error('Invalid access token', 'UNAUTHORIZED', 401);
        }
        return res.status(401).json({ message: 'Invalid access token' });
    }
}

module.exports = authMiddleware;