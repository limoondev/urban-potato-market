const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
            message: "Authentication successful. Welcome to Arcane."
        });
    });
});

app.listen(PORT, () => {
    console.log(`[Arcane Server] Listening on port ${PORT}`);
    console.log(`[Arcane Server] Mode: Authentication & Licensing`);
});
