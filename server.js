const express = require('express');
const cors = require('cors');
const axios = require('axios');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the fake "Cannot GET /" page which hides the secret terminal
const path = require('path');
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'secret_shell.html'));
});

// Arcane Authentication Endpoint
app.post('/api/auth', (req, res) => {
    const { license_key, hwid } = req.body;

    // 1. Keyless Weekend Logic
    const dayOfWeek = new Date().getDay(); // 0 is Sunday, 6 is Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return res.json({
            success: true,
            message: "Keyless Weekend Active. Welcome to Arcane!"
        });
    }

    // 2. Validate Input
    if (!license_key) {
        return res.json({ success: false, message: "License key is required." });
    }

    // 3. Database Check
    db.get("SELECT * FROM licenses WHERE key = ?", [license_key], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Internal server error." });
        }

        if (!row) {
            return res.json({ success: false, message: "Invalid license key." });
        }

        if (row.is_banned) {
            return res.json({ success: false, message: "This license has been banned." });
        }

        // Expiration Check
        if (row.expiration_date) {
            const expDate = new Date(row.expiration_date);
            if (new Date() > expDate) {
                return res.json({ success: false, message: "License has expired." });
            }
        }

        // HWID Locking Logic
        if (row.hwid && hwid && row.hwid !== hwid) {
            return res.json({ success: false, message: "HWID mismatch. Please reset your HWID." });
        } else if (!row.hwid && hwid) {
            // Lock to new HWID
            db.run("UPDATE licenses SET hwid = ? WHERE key = ?", [hwid, license_key]);
        }

        return res.json({
            success: true,
            message: "Authentication successful. Welcome to Arcane.",
            discord_username: row.discord_username || "User",
            discord_avatar: row.discord_avatar || ""
        });
    });
});

// Admin Route to generate keys via Discord bot or web panel
app.post('/api/admin/generate', async (req, res) => {
    const { admin_secret, days, discord_id } = req.body;
    
    // In production, change this secret and use environment variables!
    const ADMIN_SECRET = process.env.ADMIN_SECRET || "arcane_secret_admin_123";
    
    if (admin_secret !== ADMIN_SECRET) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const duration = parseInt(days) || 30;
    const crypto = require('crypto');
    const key = "ARCANE-" + crypto.randomBytes(6).toString('hex').toUpperCase();

    const expDate = new Date();
    expDate.setDate(expDate.getDate() + duration);

    let discordUsername = "";
    let discordAvatar = "";

    if (discord_id) {
        try {
            // Use a public discord lookup API to get user info
            const response = await axios.get(`https://discordlookup.mesalinc.com/v1/user/${discord_id}`);
            if (response.data) {
                discordUsername = response.data.username;
                // Construct avatar URL
                if (response.data.avatar) {
                    const ext = response.data.avatar.startsWith('a_') ? 'gif' : 'png';
                    discordAvatar = `https://cdn.discordapp.com/avatars/${discord_id}/${response.data.avatar}.${ext}?size=64`;
                }
            }
        } catch (e) {
            console.log("Could not fetch discord user:", e.message);
        }
    }

    db.run("INSERT INTO licenses (key, discord_id, discord_username, discord_avatar, expiration_date) VALUES (?, ?, ?, ?, ?)", 
        [key, discord_id || null, discordUsername || null, discordAvatar || null, expDate.toISOString()], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Database error" });
        }
        return res.json({
            success: true,
            key: key,
            duration_days: duration,
            expiration: expDate.toISOString(),
            discord_username: discordUsername,
            discord_avatar: discordAvatar
        });
    });
});

app.listen(PORT, () => {
    console.log(`[Arcane Server] Listening on port ${PORT}`);
    console.log(`[Arcane Server] Mode: Authentication & Licensing`);
});
