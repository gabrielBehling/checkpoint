const express = require("express");
const sql = require("mssql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { object, string } = require("yup");
const { createClient } = require("redis");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const path = require('path');
const responseMiddleware = require("./responseMiddleware");
const profileUpload = require("./middleware/profileUpload");

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

// Accept JSON bodies as usual
app.use(express.json());
app.use(cookieParser());
app.use(responseMiddleware);

// Serve uploaded profile images
app.use('/uploads/profiles', express.static(path.join(__dirname, '..', 'uploads', 'profiles')));

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
    res.success({ status: "OK" }, "Service is healthy");
});

// Rota raiz
app.get("/", (req, res) => {
    res.success({ status: "OK" }, "Auth Service is running");
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
        return res.error(e.message, "VALIDATION_ERROR", 401);
    }

    const { email, password } = input;

    try {
        await sql.connect(dbConfig);
        const userRecordbyEmail = await sql.query`
            SELECT * FROM UsersNotDeleted WHERE Email = ${email};
        `;
        if (userRecordbyEmail.recordset.length <= 0) {
            return res.error("Invalid email or password.", "INVALID_CREDENTIALS", 401);
        }

        const userRecord = userRecordbyEmail.recordset.shift();
        const username = userRecord.Username;
        const userId = userRecord.UserID;
        const userRole = userRecord.UserRole;
        const passwordHash = userRecord.PasswordHash;

        const passwordIsRight = await bcrypt.compare(password, passwordHash);

        if (!passwordIsRight) {
            return res.error("Invalid email or password.", "INVALID_CREDENTIALS", 401);
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

        return res.success(
            {
                userId,
                username,
                userRole
            },
            `Logged in successfully as ${username}.`
        );
    } catch (err) {
        return res.error("Database error", "DATABASE_ERROR", 500, err.message);
    } finally {
        await sql.close();
    }
});

let registerInputSquema = object({
    username: string().required().max(50),
    email: string().email().required().max(100),
    password: string().required().matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&#\.]{8,}$/, "Password must be at least 8 characters long and contain at least one letter and one number."),
    userRole: string()
        .matches(/(Administrator|Player|Organizer|Visitor)/, { excludeEmptyString: true, message: "Invalid user role. Allowed roles are Administrator, Player, Organizer and Visitor" })
        .default("Visitor"),
});

app.post("/register", profileUpload, async (req, res) => {
    let input, userId;
    try {
        input = await registerInputSquema.validate(req.body, { disableStackTrace: true });
    } catch (e) {
        return res.error(e.message, "VALIDATION_ERROR", 401);
    }

    const { username, email, password, userRole } = input;
    if (userRole === "Administrator") {
        let { token } = req.cookies;
        if (!token) {
            return res.error("Token is required for Administrator role.", "ADMIN_TOKEN_REQUIRED", 400);
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET, { maxAge: "1h" });
            if (decoded.userRole !== "Administrator") {
                return res.error("User is not an Administrator.", "UNAUTHORIZED", 401);
            }
        } catch (err) {
            return res.error("Invalid or expired token.", "INVALID_TOKEN", 401);
        }
    }

    // If a profile image was uploaded, build the URL to store in DB
    let profileURL = null;
    if (req.file) {
        profileURL = `/uploads/profiles/${req.file.filename}`;
    }

    try {
        await sql.connect(dbConfig);
        const usernameExists = await sql.query`
            SELECT * FROM UsersNotDeleted WHERE Username = ${username};
        `;
        if (usernameExists.recordset.length > 0) {
            return res.error("Username already exists.", "USERNAME_EXISTS", 400);
        }

        const emailExists = await sql.query`
            SELECT * FROM UsersNotDeleted WHERE Email = ${email};
        `;
        if (emailExists.recordset.length > 0) {
            return res.error("Email already exists.", "EMAIL_EXISTS", 400);
        }

        const PasswordHash = await bcrypt.hash(password, 10);

        // Insert including ProfileURL (column must exist in DB)
        const result = await sql.query`
            INSERT INTO Users (Username, Email, PasswordHash, UserRole, ProfileURL)
            OUTPUT Inserted.UserID
            VALUES (${username}, ${email}, ${PasswordHash}, ${userRole}, ${profileURL});
        `;
        userId = result.recordset.shift().UserID; // Get the inserted UserID
    } catch (err) {
        return res.error("Database error", "DATABASE_ERROR", 500, err.message);
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

    return res.success(
        {
            userId,
            username,
            userRole,
            profileURL
        },
        `User ${username} registered successfully as ${userRole}.`
    );
});

app.post("/refresh-token", async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    const lastAccessToken = req.cookies.accessToken;

    if (!refreshToken || !lastAccessToken) {
        return res.error("Both refresh token and last access token are required.", "TOKENS_REQUIRED", 401);
    }

    try {
        // First verify the structure of the last access token (even if expired)
        let lastAccessDecoded;
        try {
            lastAccessDecoded = jwt.verify(lastAccessToken, process.env.JWT_SECRET, { ignoreExpiration: true });
        } catch (err) {
            return res.error("Invalid access token format.", "INVALID_TOKEN_FORMAT", 401);
        }

        await sql.connect(dbConfig);
        const decoded = await verifyRefreshToken(refreshToken);

        // Verify that the tokens belong to the same user
        if (lastAccessDecoded.userId !== decoded.userId) {
            return res.error("Token mismatch.", "TOKEN_MISMATCH", 401);
        }

        const userRecord = await sql.query`
            SELECT Username, UserID, UserRole 
            FROM UsersNotDeleted 
            WHERE UserID = ${decoded.userId};
        `;

        if (userRecord.recordset.length === 0) {
            return res.error("User not found.", "USER_NOT_FOUND", 404);
        }

        const userFields = userRecord.recordset.shift();
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

        return res.success(
            {
                userId: user.userId,
                username: user.username,
                userRole: user.userRole
            },
            "Token refreshed successfully."
        );
    } catch (error) {
        return res.error(error.message, "REFRESH_TOKEN_ERROR", 401);
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
    return res.success(null, "User successfully logged out.");
});

app.delete("/delete-account", async (req, res) => {
    const token = req.cookies.accessToken;
    if (!token) {
        return res.error("Authentication token required.", "TOKEN_REQUIRED", 401);
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET, { maxAge: "1h" });
    } catch (err) {
        return res.error("Invalid or expired token.", "INVALID_TOKEN", 401);
    }

    const userId = decoded.userId;

    try {
        await sql.connect(dbConfig);
        const result = await sql.query`
            UPDATE Users SET DeletedAt = GETDATE() WHERE UserID = ${userId} AND DeletedAt IS NULL;
        `;
        if (result.rowsAffected[0] === 0) {
            return res.error("User not found or already deleted.", "USER_NOT_FOUND", 404);
        }

        // Delete refresh token from Redis
        let redis = await getRedis();
        await redis.del(`refresh_token:${userId}`);
    } catch (err) {
        return res.error("Database error", "DATABASE_ERROR", 500, err.message);
    } finally {
        await sql.close();
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res.success(null, "Account deleted successfully.");
});

app.get("/me", async (req, res) => {
    const token = req.cookies.accessToken;
    if (!token) {
        return res.error("Authentication token required.", "TOKEN_REQUIRED", 401);
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET, { maxAge: "1h" });
    } catch (err) {
        return res.error("Invalid or expired token.", "INVALID_TOKEN", 401);
    }

    const userId = decoded.userId;

    try {
        await sql.connect(dbConfig);

        // Fetch user email and basic info from view
        const userRecord = await sql.query`
            SELECT UserID, Username, UserRole, Email, ProfileURL
            FROM UsersNotDeleted
            WHERE UserID = ${userId};
        `;

        if (userRecord.recordset.length === 0) {
            return res.error("User not found.", "USER_NOT_FOUND", 404);
        }

        const userFields = userRecord.recordset.shift();
        const email = userFields.Email;
        const username = userFields.Username;
        const userRole = userFields.UserRole;
        const profileURL = userFields.ProfileURL;

        // Fetch user's event registration history:
        // 1) personal registrations (er.UserID)
        // 2) team registrations where the user is a member of the registered team
        const personalRegs = await sql.query`
            SELECT er.RegistrationID, er.EventID, e.Title, e.StartDate, e.EndDate, er.Status, er.RegisteredAt,
                   NULL AS TeamID, NULL AS TeamName, 0 AS ViaTeam
            FROM EventRegistrations er
            JOIN EventsNotDeleted e ON e.EventID = er.EventID
            WHERE er.UserID = ${userId} AND er.DeletedAt IS NULL;
        `;

        const teamRegs = await sql.query`
            SELECT er.RegistrationID, er.EventID, e.Title, e.StartDate, e.EndDate, er.Status, er.RegisteredAt,
                   t.TeamID, t.TeamName, 1 AS ViaTeam
            FROM EventRegistrations er
            JOIN EventsNotDeleted e ON e.EventID = er.EventID
            JOIN TeamMembers tm ON tm.TeamID = er.TeamID
            JOIN TeamsNotDeleted t ON t.TeamID = er.TeamID
            WHERE tm.UserID = ${userId} AND tm.DeletedAt IS NULL AND er.DeletedAt IS NULL;
        `;

        // Merge and normalize results, avoid duplicates by registrationId
        const combined = [];
        const seen = new Set();

        const pushRecord = (r) => {
            if (!r || seen.has(r.RegistrationID)) return;
            seen.add(r.RegistrationID);
            combined.push(r);
        };

        (personalRegs.recordset || []).forEach(pushRecord);
        (teamRegs.recordset || []).forEach(pushRecord);

        // Sort by registeredAt desc
        combined.sort((a, b) => new Date(b.RegisteredAt) - new Date(a.RegisteredAt));

        const eventsHistory = combined.map((r) => ({
            registrationId: r.RegistrationID,
            eventId: r.EventID,
            title: r.Title,
            startDate: r.StartDate,
            endDate: r.EndDate,
            status: r.Status,
            registeredAt: r.RegisteredAt,
            viaTeam: !!r.ViaTeam,
            teamId: r.TeamID || null,
            teamName: r.TeamName || null,
        }));

        return res.success(
            {
                userId,
                username,
                userRole,
                email,
                profileURL,
                eventsHistory,
            },
            "User information retrieved successfully"
        );
    } catch (err) {
        return res.error("Database error", "DATABASE_ERROR", 500, err.message);
    } finally {
        await sql.close();
    }
});

// Password reset request endpoint
app.post("/request-password-reset", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.error("Email is required.", "EMAIL_REQUIRED", 400);
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
            return res.success(null, "If your email is registered, you will receive reset instructions.");
        }

        const resetToken = generateResetToken();
        await storeResetToken(email, resetToken);

        await sendResetEmail(email, resetToken);

        return res.success(null, "If your email is registered, you will receive reset instructions.");
    } catch (err) {
        return res.error("Failed to process password reset request.", "RESET_REQUEST_FAILED", 500);
    } finally {
        await sql.close();
    }
});


// Update user info endpoint
const updateInputSchema = object({
    username: string().max(50),
    email: string().email().max(100),
    userRole: string().matches(/(Administrator|Player|Organizer|Visitor)/, { excludeEmptyString: true, message: "Invalid user role. Allowed roles are Administrator, Player, Organizer and Visitor" }),
});

app.put("/update-info", profileUpload, async (req, res) => {
    const token = req.cookies.accessToken;
    if (!token) {
        return res.error("Authentication token required.", "TOKEN_REQUIRED", 401);
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET, { maxAge: "1h" });
    } catch (err) {
        return res.error("Invalid or expired token.", "INVALID_TOKEN", 401);
    }

    let input;
    try {
        input = await updateInputSchema.validate(req.body, { disableStackTrace: true });
    } catch (e) {
        return res.error(e.message, "VALIDATION_ERROR", 400);
    }

    const { username, email, userRole } = input;
    const userId = decoded.userId;

    // If a profile image was uploaded, build the URL to store in DB
    let profileURL = null;
    if (req.file) {
        profileURL = `/uploads/profiles/${req.file.filename}`;
    }

    try {
        await sql.connect(dbConfig);

        // Check for unique username/email if updating
        if (username) {
            const usernameExists = await sql.query`
                SELECT * FROM UsersNotDeleted WHERE Username = ${username} AND UserID != ${userId};
            `;
            if (usernameExists.recordset.length > 0) {
                return res.error("Username already exists.", "USERNAME_EXISTS", 400);
            }
        }
        if (email) {
            const emailExists = await sql.query`
                SELECT * FROM UsersNotDeleted WHERE Email = ${email} AND UserID != ${userId};
            `;
            if (emailExists.recordset.length > 0) {
                return res.error("Email already exists.", "EMAIL_EXISTS", 400);
            }
        }

        // Build update query
        let updateFields = [];
        if (username) updateFields.push(`Username = @username`);
        if (email) updateFields.push(`Email = @email`);
        if (userRole) updateFields.push(`UserRole = @userRole`);
        if (profileURL) updateFields.push(`ProfileURL = @profileURL`);

        if (updateFields.length === 0) {
            return res.error("No valid fields to update.", "VALIDATION_ERROR", 400);
        }

        // Use parameterized query for safety
        const request = new sql.Request();
        if (username) request.input("username", sql.VarChar(50), username);
        if (email) request.input("email", sql.VarChar(100), email);
        if (userRole) request.input("userRole", sql.VarChar(20), userRole);
        if (profileURL) request.input("profileURL", sql.VarChar(255), profileURL);
        request.input("userId", sql.Int, userId);

        const updateQuery = `UPDATE Users SET ${updateFields.join(", ")} WHERE UserID = @userId AND DeletedAt IS NULL;`;
        const result = await request.query(updateQuery);

        if (result.rowsAffected[0] === 0) {
            return res.error("User not found or already deleted.", "USER_NOT_FOUND", 404);
        }

        // Return updated info
        const userRecord = await sql.query`
            SELECT UserID, Username, UserRole, Email, ProfileURL
            FROM UsersNotDeleted
            WHERE UserID = ${userId};
        `;
        if (userRecord.recordset.length === 0) {
            return res.error("User not found.", "USER_NOT_FOUND", 404);
        }
        const userFields = userRecord.recordset.shift();
        return res.success({
            userId: userFields.UserID,
            username: userFields.Username,
            userRole: userFields.UserRole,
            email: userFields.Email,
            profileURL: userFields.ProfileURL,
        }, "User info updated successfully.");
    } catch (err) {
        return res.error("Database error", "DATABASE_ERROR", 500, err.message);
    } finally {
        await sql.close();
    }
});

// Reset password endpoint
app.post("/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.error("Token and new password are required.", "TOKEN_AND_PASSWORD_REQUIRED", 400);
    }

    try {
        let redis = await getRedis();
        const email = await redis.get(`pwreset:${token}`);
        if (!email) {
            return res.error("Invalid or expired reset token.", "INVALID_RESET_TOKEN", 401);
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
            return res.error("User not found.", "USER_NOT_FOUND", 404);
        }

        // Invalidate all refresh tokens for this user for security
        const userResult = await sql.query`
            SELECT UserID FROM Users WHERE Email = ${email};
        `;
        if (userResult.recordset.length > 0) {
            let redis = await getRedis();
            await redis.del(`refresh_token:${userResult.recordset[0].UserID}`);
        }

        return res.success(null, "Password has been reset successfully.");
    } catch (err) {
        return res.error("Failed to reset password.", "RESET_PASSWORD_FAILED", 500);
    } finally {
        await sql.close();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Auth Service is running on port ${PORT}`);
});
