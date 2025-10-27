const express = require("express");
const sql = require("mssql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { object, string } = require("yup");
const { createClient } = require("redis");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const app = express();

// Redis client setup
const getRedis = async () => {
    return await createClient({
        url: `redis://${process.env.REDIS_USER}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST || "redis"}:${process.env.REDIS_PORT || 6379}`,
    })
        .on("error", (err) => console.log("Redis Client Error", err))
        .connect();
};

// Email configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Password reset helper functions
const generateResetToken = () => {
    return crypto.randomBytes(32).toString("hex");
};

const storeResetToken = async (email, token) => {
    let redis = await getRedis();
    await redis.set(
        `pwreset:${token}`,
        email,
        "EX",
        15 * 60 // 15 minutes expiration
    );
};

const sendResetEmail = async (email, token) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
        from: process.env.SMTP_FROM || "noreply@checkpoint.com",
        to: email,
        subject: "Password Reset Request",
        html: `
            <h1>Password Reset Request</h1>
            <p>You requested to reset your password. Click the link below to proceed:</p>
            <a href="${resetUrl}">Reset Password</a>
            <p>This link will expire in 15 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
        `,
    };

    await transporter.sendMail(mailOptions);
};

require("dotenv").config({ path: "../../.env.senai" });

// Configuração do banco de dados
const dbConfig = {
    server: process.env.MSSQL_SERVER,
    port: parseInt(process.env.MSSQL_PORT),
    database: process.env.MSSQL_DATABASE,
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    options: {
        trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE === "True",
        encrypt: true,
    },
};

app.use(express.json());
app.use(cookieParser());

// Token management functions
const generateAccessToken = (user) => {
    return jwt.sign({ username: user.username, userId: user.userId, userRole: user.userRole }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

const generateRefreshToken = (user) => {
    return jwt.sign({ userId: user.userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

const storeRefreshToken = async (userId, refreshToken) => {
    let redis = await getRedis();
    let a = await redis.set(`refresh_token:${userId}`, refreshToken, {
        EX: 7 * 24 * 60 * 60, // 7 days expiration
    });
};

const verifyRefreshToken = async (refreshToken) => {
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        let redis = await getRedis();
        const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
        if (!storedToken || storedToken !== refreshToken) {
            throw new Error("Invalid refresh token");
        }
        return decoded;
    } catch (error) {
        throw new Error("Invalid refresh token");
    }
};

// Rota de health check
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
    });
});

// Rota raiz
app.get("/", (req, res) => {
    res.json({
        status: "OK",
        message: "Auth Service is running",
    });
});

let loginInputSquema = object({
    email: string().email().required(),
    password: string().required(),
});
app.post("/login", async (req, res) => {
    let input;
    try {
        input = await loginInputSquema.validate(req.body, { disableStackTrace: true });
    } catch (e) {
        return res.status(401).json({ Error: e.message });
    }

    const { email, password } = input;

    try {
        await sql.connect(dbConfig);
        const userRecordbyEmail = await sql.query`
            SELECT * FROM UsersNotDeleted WHERE Email = ${email};
        `;
        if (userRecordbyEmail.recordset.length <= 0) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const userRecord = userRecordbyEmail.recordset.shift();
        const username = userRecord.Username;
        const userId = userRecord.UserID;
        const userRole = userRecord.UserRole;
        const passwordHash = userRecord.PasswordHash;

        const passwordIsRight = await bcrypt.compare(password, passwordHash);

        if (!passwordIsRight) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const user = { username, userId, userRole };
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await storeRefreshToken(userId, refreshToken);

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(200).json({
            message: `Logged in successfully as ${username}.`,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        return res.status(500).json({ error: "Database error", details: err });
    } finally {
        await sql.close();
    }
});

let registerInputSquema = object({
    username: string().required().max(50),
    email: string().email().required().max(100),
    password: string().required(),
    userRole: string()
        .matches(/(Administrator|Player|Organizer|Visitor)/, { excludeEmptyString: true, message: "Invalid user role. Allowed roles are Administrator, Player, Organizer and Visitor" })
        .default("Visitor"),
});

app.post("/register", async (req, res) => {
    let input, userId;
    try {
        input = await registerInputSquema.validate(req.body, { disableStackTrace: true });
    } catch (e) {
        return res.status(401).json({ error: e.message });
    }

    const { username, email, password, userRole } = input;
    if (userRole === "Administrator") {
        let { token } = req.cookies;
        if (!token) {
            return res.status(400).json({ error: "Token is required for Administrator role." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET, { maxAge: "1h" });
        if (!decoded) {
            return res.status(401).json({ error: "Invalid or expired token." });
        }

        if (decoded.userRole !== "Administrator") {
            return res.status(401).json({ error: "User is not an Administrator." });
        }
    }

    try {
        await sql.connect(dbConfig);
        const usernameExists = await sql.query`
            SELECT * FROM UsersNotDeleted WHERE Username = ${username};
        `;
        if (usernameExists.recordset.length > 0) {
            return res.status(400).json({ error: "Username already exists." });
        }

        const emailExists = await sql.query`
            SELECT * FROM UsersNotDeleted WHERE Email = ${email};
        `;
        if (emailExists.recordset.length > 0) {
            return res.status(400).json({ error: "Email already exists." });
        }

        const PasswordHash = await bcrypt.hash(password, 10);

        const result = await sql.query`
            INSERT INTO Users (Username, Email, PasswordHash, UserRole)
            OUTPUT Inserted.UserID
            VALUES (${username}, ${email}, ${PasswordHash}, ${userRole});
        `;
        userId = result.recordset.shift().UserID; // Get the inserted UserID
    } catch (err) {
        return res.status(500).json({ error: "Database error", details: err });
    } finally {
        await sql.close();
    }

    const user = { username, userId, userRole };
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await storeRefreshToken(userId, refreshToken);

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
        message: `User ${username} registered successfully as ${userRole}.`,
        timestamp: new Date().toISOString(),
    });
});

app.post("/refresh-token", async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    const lastAccessToken = req.cookies.accessToken;

    if (!refreshToken || !lastAccessToken) {
        return res.status(401).json({ error: "Both refresh token and last access token are required." });
    }

    try {
        // First verify the structure of the last access token (even if expired)
        let lastAccessDecoded;
        try {
            lastAccessDecoded = jwt.verify(lastAccessToken, process.env.JWT_SECRET, { ignoreExpiration: true });
        } catch (err) {
            return res.status(401).json({ error: "Invalid access token format." });
        }

        await sql.connect(dbConfig);
        const decoded = await verifyRefreshToken(refreshToken);

        // Verify that the tokens belong to the same user
        if (lastAccessDecoded.userId !== decoded.userId) {
            return res.status(401).json({ error: "Token mismatch." });
        }

        const userRecord = await sql.query`
            SELECT Username, UserID, UserRole 
            FROM UsersNotDeleted 
            WHERE UserID = ${decoded.userId};
        `;

        if (userRecord.recordset.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }

        userFields = userRecord.recordset.shift();
        const user = { username: userFields.Username, userId: userFields.UserID, userRole: userFields.UserRole };
        const accessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        await storeRefreshToken(user.userId, newRefreshToken);

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({ message: "Token refreshed successfully." });
    } catch (error) {
        res.status(401).json({ error: error.message });
    } finally {
        await sql.close();
    }
});

app.post("/logout", async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
        try {
            const decoded = jwt.decode(refreshToken);
            if (decoded && decoded.userId) {
                let redis = await getRedis();
                await redis.del(`refresh_token:${decoded.userId}`);
            }
        } catch (error) {
            // Ignore errors during logout
        }
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "User successfully logged out." });
});

app.delete("/delete-account", async (req, res) => {
    const token = req.cookies.accessToken;
    if (!token) {
        return res.status(401).json({ error: "Authentication token required." });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET, { maxAge: "1h" });
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token." });
    }

    const userId = decoded.userId;

    try {
        await sql.connect(dbConfig);
        const result = await sql.query`
            UPDATE Users SET DeletedAt = GETDATE() WHERE UserID = ${userId} AND DeletedAt IS NULL;
        `;
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "User not found or already deleted." });
        }

        // Delete refresh token from Redis
        let redis = await getRedis();
        await redis.del(`refresh_token:${userId}`);
    } catch (err) {
        return res.status(500).json({ error: "Database error", details: err });
    } finally {
        await sql.close();
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Account deleted successfully." });
});

app.get("/me", async (req, res) => {
    const token = req.cookies.accessToken;
    if (!token) {
        return res.status(401).json({ error: "Authentication token required." });
    }
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET, { maxAge: "1h" });
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token." });
    }

    try {
        await sql.connect(dbConfig);
        const userRecord = await sql.query`
            SELECT UserID, Username, Email, UserRole
            FROM UsersNotDeleted
            WHERE UserID = ${decoded.userId};
        `;
        if (userRecord.recordset.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }
        const userInfo = userRecord.recordset.shift();

        const historyRecords = await sql.query`
            SELECT e.EventID, e.Title, e.Description, e.Status, e.BannerURL, g.GameName
            FROM EventsNotDeleted e
            JOIN Games g ON e.GameID = g.GameID
            JOIN EventRegistrations er ON e.EventID = er.EventID
            JOIN TeamMembers tm ON er.TeamID = tm.TeamID
            WHERE er.UserID = ${decoded.userId} OR tm.UserID = ${decoded.userId};
        `;
        const user = {
            ...userInfo,
            eventHistory: historyRecords.recordset,
        };
        res.status(200).json(user);
    } catch (err) {
        return res.status(500).json({ error: "Database error", details: err });
    } finally {
        await sql.close();
    }
});

// Password reset request endpoint
app.post("/request-password-reset", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email is required." });
    }

    try {
        await sql.connect(dbConfig);
        const userResult = await sql.query`
            SELECT Email, UserID 
            FROM UsersNotDeleted 
            WHERE Email = ${email};
        `;

        if (userResult.recordset.length === 0) {
            // Return success even if email doesn't exist to prevent email enumeration
            return res.status(200).json({
                message: "If your email is registered, you will receive reset instructions.",
            });
        }

        const resetToken = generateResetToken();
        await storeResetToken(email, resetToken);

        await sendResetEmail(email, resetToken);

        res.status(200).json({
            message: "If your email is registered, you will receive reset instructions.",
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to process password reset request." });
    } finally {
        await sql.close();
    }
});

// Reset password endpoint
app.post("/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required." });
    }

    try {
        let redis = await getRedis();
        const email = await redis.get(`pwreset:${token}`);
        if (!email) {
            return res.status(401).json({ error: "Invalid or expired reset token." });
        }

        // Delete the token immediately to prevent reuse
        redis = await getRedis();
        await redis.del(`pwreset:${token}`);

        await sql.connect(dbConfig);

        // Hash the new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update the password
        const result = await sql.query`
            UPDATE Users 
            SET PasswordHash = ${passwordHash}
            WHERE Email = ${email} AND DeletedAt IS NULL;
        `;

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: "User not found." });
        }

        // Invalidate all refresh tokens for this user for security
        const userResult = await sql.query`
            SELECT UserID FROM Users WHERE Email = ${email};
        `;
        if (userResult.recordset.length > 0) {
            let redis = await getRedis();
            await redis.del(`refresh_token:${userResult.recordset[0].UserID}`);
        }

        res.status(200).json({
            message: "Password has been reset successfully.",
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to reset password." });
    } finally {
        await sql.close();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Auth Service is running on port ${PORT}`);
});
