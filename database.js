const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'licenses.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS licenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            hwid TEXT,
            is_banned INTEGER DEFAULT 0,
            expiration_date TEXT
        )`, (err) => {
            if (err) {
                console.error('Error creating table', err.message);
            } else {
                // Seed database with a test key if empty
                db.get("SELECT COUNT(*) as count FROM licenses", (err, row) => {
                    if (row.count === 0) {
                        db.run("INSERT INTO licenses (key) VALUES ('ARCANE-VIP-1337-KEY')");
                        console.log('Database seeded with test key: ARCANE-VIP-1337-KEY');
                    }
                });
            }
        });
    }
});

module.exports = db;
