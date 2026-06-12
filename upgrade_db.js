const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'licenses.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        process.exit(1);
    }
    console.log('Connected to the SQLite database. Upgrading schema...');
});

db.serialize(() => {
    db.run("ALTER TABLE licenses ADD COLUMN discord_id TEXT", (err) => {
        if (err) console.log("[-] Column discord_id: " + err.message);
        else console.log("[+] Added discord_id column.");
    });
    
    db.run("ALTER TABLE licenses ADD COLUMN discord_username TEXT", (err) => {
        if (err) console.log("[-] Column discord_username: " + err.message);
        else console.log("[+] Added discord_username column.");
    });
    
    db.run("ALTER TABLE licenses ADD COLUMN discord_avatar TEXT", (err) => {
        if (err) console.log("[-] Column discord_avatar: " + err.message);
        else console.log("[+] Added discord_avatar column.");
    });
});

db.close(() => {
    console.log("=====================================");
    console.log("Database upgrade finished successfully!");
    console.log("You can now start the server using: npm start");
    console.log("=====================================");
});
