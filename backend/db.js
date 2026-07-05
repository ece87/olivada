const { DatabaseSync } = require("node:sqlite");
const path = require("path");


// Veritabanı dosyasının konumu
const databasePath = path.join(
    __dirname,
    "data",
    "olivada.db"
);


// Veritabanını aç
const db = new DatabaseSync(databasePath);


// Temel ayarlar
db.exec(`
    PRAGMA foreign_keys = ON;
`);


// Sipariş tablosunu oluştur
db.exec(`
    CREATE TABLE IF NOT EXISTS orders (

        id INTEGER PRIMARY KEY,

        order_number TEXT NOT NULL UNIQUE,

        customer_name TEXT NOT NULL,

        phone TEXT NOT NULL,

        address TEXT NOT NULL,

        product TEXT NOT NULL,

        quantity TEXT NOT NULL,

        status TEXT NOT NULL
            DEFAULT 'Yeni Sipariş',

        created_at TEXT NOT NULL

    );
`);


module.exports = db;