const db = require('./database');
const crypto = require('crypto');

// Utilisation: node generate_key.js [nombre_de_jours]
// Exemple: node generate_key.js 7

const days = parseInt(process.argv[2]) || 30; // 30 jours par défaut
const key = "ARCANE-" + crypto.randomBytes(6).toString('hex').toUpperCase();

const expDate = new Date();
expDate.setDate(expDate.getDate() + days);

db.run("INSERT INTO licenses (key, expiration_date) VALUES (?, ?)", [key, expDate.toISOString()], function(err) {
    if (err) {
        console.error("Erreur lors de l'ajout de la clé:", err);
        process.exit(1);
    }
    console.log("=====================================");
    console.log(`🔑 NOUVELLE CLÉ GÉNÉRÉE AVEC SUCCÈS`);
    console.log("=====================================");
    console.log(`Clé       : ${key}`);
    console.log(`Durée     : ${days} jours`);
    console.log(`Expiration: ${expDate.toLocaleString()}`);
    console.log("=====================================");
    process.exit(0);
});
