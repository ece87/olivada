const fs = require("fs").promises;
const path = require("path");

const ordersFilePath = path.join(
    __dirname,
    "data",
    "orders.json"
);

async function migrateOrders() {
    try {
        const fileData = await fs.readFile(
            ordersFilePath,
            "utf8"
        );

        const orders = JSON.parse(fileData);

        const currentYear = new Date().getFullYear();

        let highestSequence = 0;

        // Daha önce numara verilmiş siparişlerin
        // en yüksek sıra numarasını bul
        orders.forEach(function (order) {
            if (
                order.orderNumber &&
                order.orderNumber.startsWith(
                    `OLV-${currentYear}-`
                )
            ) {
                const parts =
                    order.orderNumber.split("-");

                const sequence =
                    Number(parts[2]);

                if (
                    !Number.isNaN(sequence) &&
                    sequence > highestSequence
                ) {
                    highestSequence = sequence;
                }
            }
        });

        // Numarası olmayan eski siparişlere numara ver
        orders.forEach(function (order) {
            if (!order.orderNumber) {
                highestSequence++;

                order.orderNumber =
                    `OLV-${currentYear}-${String(
                        highestSequence
                    ).padStart(4, "0")}`;
            }
        });

        await fs.writeFile(
            ordersFilePath,
            JSON.stringify(orders, null, 2),
            "utf8"
        );

        console.log(
            "Tüm eski siparişlere profesyonel sipariş numarası verildi 🌿"
        );

    } catch (error) {
        console.error(
            "Dönüştürme hatası:",
            error
        );
    }
}

migrateOrders();