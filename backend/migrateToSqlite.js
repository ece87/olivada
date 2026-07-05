const fs = require("fs");
const path = require("path");

const db = require("./db");


const jsonFilePath = path.join(
    __dirname,
    "data",
    "orders.json"
);


// JSON dosyasını oku
const fileData = fs.readFileSync(
    jsonFilePath,
    "utf8"
);


const orders = JSON.parse(fileData);


// Kullanılmış sipariş numaraları
const usedOrderNumbers = new Set(
    orders
        .map(function (order) {
            return order.orderNumber;
        })
        .filter(Boolean)
);


const yearCounters = new Map();


// Numarası olmayan siparişler için
// yedek sipariş numarası oluşturur
function createOrderNumber(order) {

    const orderDate =
        order.createdAt
            ? new Date(order.createdAt)
            : new Date();


    const year = orderDate.getFullYear();


    let sequence =
        yearCounters.get(year) || 0;


    let candidate;


    do {

        sequence++;

        candidate =
            `OLV-${year}-${String(sequence).padStart(4, "0")}`;

    } while (
        usedOrderNumbers.has(candidate)
    );


    yearCounters.set(
        year,
        sequence
    );


    usedOrderNumbers.add(
        candidate
    );


    return candidate;
}


// INSERT sorgusu
const insertOrder = db.prepare(`
    INSERT OR IGNORE INTO orders (

        id,
        order_number,
        customer_name,
        phone,
        address,
        product,
        quantity,
        status,
        created_at

    )

    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);


let insertedCount = 0;


// İşlemi başlat
db.exec("BEGIN");


try {

    orders.forEach(function (order) {

        const orderNumber =
            order.orderNumber ||
            createOrderNumber(order);


        const result = insertOrder.run(

            order.id,

            orderNumber,

            order.customerName,

            order.phone,

            order.address,

            order.product,

            order.quantity,

            order.status || "Yeni Sipariş",

            order.createdAt ||
                new Date().toISOString()

        );


        insertedCount +=
            Number(result.changes);

    });


    db.exec("COMMIT");


    const countResult =
        db.prepare(`
            SELECT COUNT(*) AS total
            FROM orders
        `).get();


    console.log(
        `${insertedCount} sipariş SQLite veritabanına aktarıldı 🌿`
    );


    console.log(
        `Veritabanındaki toplam sipariş: ${countResult.total}`
    );


} catch (error) {

    db.exec("ROLLBACK");


    console.error(
        "Taşıma sırasında hata oluştu:",
        error
    );


    process.exitCode = 1;
}