const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const db = require("./db");

dotenv.config();

const app = express();
const PORT = 3000;


// Middleware
app.use(cors());
app.use(express.json());




// ADMIN KONTROLÜ
// ==============================
// ADMIN OTURUM SİSTEMİ
// ==============================

const adminSessions = new Map();

const loginAttempts = new Map();

const MAX_LOGIN_ATTEMPTS = 5;

const LOGIN_BLOCK_DURATION =
    15 * 60 * 1000;


// Oturum süresi: 2 saat
const ADMIN_SESSION_DURATION =
    2 * 60 * 60 * 1000;


function getLoginAttemptData(ip) {

    const existing =
        loginAttempts.get(ip);


    if (!existing) {

        return {
            count: 0,
            blockedUntil: null
        };

    }


    if (
        existing.blockedUntil &&
        existing.blockedUntil <= Date.now()
    ) {

        loginAttempts.delete(ip);

        return {
            count: 0,
            blockedUntil: null
        };

    }


    return existing;
}

// ==============================
// ADMIN ŞİFRE KONTROLÜ
// ==============================

function verifyAdminPassword(password) {

    const salt =
        process.env.ADMIN_PASSWORD_SALT;


    const expectedHash =
        process.env.ADMIN_PASSWORD_HASH;


    if (
        !password ||
        !salt ||
        !expectedHash
    ) {

        return false;

    }


    const calculatedHash =
        crypto.scryptSync(
            password,
            salt,
            64
        );


    const expectedHashBuffer =
        Buffer.from(
            expectedHash,
            "hex"
        );


    if (
        calculatedHash.length !==
        expectedHashBuffer.length
    ) {

        return false;

    }


    return crypto.timingSafeEqual(
        calculatedHash,
        expectedHashBuffer
    );

}


// ==============================
// BEARER TOKEN OKUMA
// ==============================

function getBearerToken(req) {

    const authHeader =
        req.headers.authorization || "";


    if (
        !authHeader.startsWith("Bearer ")
    ) {

        return "";

    }


    return authHeader.slice(7);

}


// ==============================
// SÜRESİ DOLAN OTURUMLARI TEMİZLE
// ==============================

function cleanExpiredAdminSessions() {

    const now =
        Date.now();


    for (
        const [token, session]
        of adminSessions.entries()
    ) {

        if (
            session.expiresAt <= now
        ) {

            adminSessions.delete(token);

        }

    }

}


// ==============================
// ADMIN KORUMA MIDDLEWARE
// ==============================

function requireAdmin(req, res, next) {

    cleanExpiredAdminSessions();


    const token =
        getBearerToken(req);


    const session =
        adminSessions.get(token);


    if (!session) {

        return res.status(401).json({

            success: false,

            message:
                "Oturum geçersiz veya süresi dolmuş."

        });

    }


    if (
        session.expiresAt <= Date.now()
    ) {

        adminSessions.delete(token);


        return res.status(401).json({

            success: false,

            message:
                "Oturum süresi dolmuş."

        });

    }


    req.adminToken = token;


    next();

}

// ==============================
// VERİTABANI SATIRINI FRONTEND
// FORMATINA DÖNÜŞTÜRME
// ==============================

function mapOrder(row) {

    if (!row) {
        return null;
    }

    return {

        id: row.id,

        orderNumber: row.order_number,

        customerName: row.customer_name,

        phone: row.phone,

        address: row.address,

        product: row.product,

        quantity: row.quantity,

        status: row.status,

        createdAt: row.created_at

    };

}


// Ana sayfa test endpointi
app.get("/", (req, res) => {

    res.send("Olivada backend çalışıyor 🌿");

});


// ==============================
// MAİL AYARLARI
// ==============================

const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }

});


// ==============================
// İLETİŞİM FORMU
// ==============================

app.post("/api/contact", async (req, res) => {

    const { name, email, message } = req.body;


    if (!name || !email || !message) {

        return res.status(400).json({
            success: false,
            message: "Lütfen tüm alanları doldurun."
        });

    }


    try {

        await transporter.sendMail({

            from: `"Olivada Web Sitesi" <${process.env.EMAIL_USER}>`,

            to: process.env.EMAIL_TO,

            replyTo: email,

            subject: "Olivada Web Sitesinden Yeni Mesaj",

            text: `
Yeni bir iletişim formu mesajı geldi.

Ad Soyad: ${name}

E-posta: ${email}

Mesaj:
${message}
            `

        });


        console.log("Yeni mesaj mail olarak gönderildi 🌿");


        res.status(200).json({

            success: true,
            message: "Mesaj başarıyla gönderildi."

        });


    } catch (error) {

        console.error(
            "Mail gönderme hatası:",
            error
        );


        res.status(500).json({

            success: false,
            message: "Mesaj gönderilirken hata oluştu."

        });

    }

});

// ==============================
// ADMIN GİRİŞ
// ==============================

app.post(
    "/api/admin/login",

    (req, res) => {

        const { password } =
            req.body;


        const clientIp =
            req.ip;


        const attemptData =
            getLoginAttemptData(clientIp);


        // Kullanıcı geçici olarak engelliyse
        if (
            attemptData.blockedUntil &&
            attemptData.blockedUntil > Date.now()
        ) {

            const remainingMinutes =
                Math.ceil(
                    (
                        attemptData.blockedUntil -
                        Date.now()
                    ) / 60000
                );


            return res.status(429).json({

                success: false,

                message:
                    `Çok fazla başarısız deneme. ${remainingMinutes} dakika sonra tekrar deneyin.`

            });

        }


        // Şifre yanlışsa
        if (
            !verifyAdminPassword(password)
        ) {

            const newCount =
                attemptData.count + 1;


            if (
                newCount >= MAX_LOGIN_ATTEMPTS
            ) {

                loginAttempts.set(
                    clientIp,
                    {
                        count: newCount,

                        blockedUntil:
                            Date.now() +
                            LOGIN_BLOCK_DURATION
                    }
                );


                return res.status(429).json({

                    success: false,

                    message:
                        "Çok fazla başarısız giriş denemesi. 15 dakika bekleyin."

                });

            }


            loginAttempts.set(
                clientIp,
                {
                    count: newCount,
                    blockedUntil: null
                }
            );


            const remainingAttempts =
                MAX_LOGIN_ATTEMPTS -
                newCount;


            return res.status(401).json({

                success: false,

                message:
                    `Şifre yanlış. Kalan deneme hakkı: ${remainingAttempts}`

            });

        }


        // Başarılı girişte yanlış deneme kaydını sil
        loginAttempts.delete(clientIp);


        cleanExpiredAdminSessions();


        const token =
            crypto
                .randomBytes(32)
                .toString("hex");


        const expiresAt =
            Date.now() +
            ADMIN_SESSION_DURATION;


        adminSessions.set(
            token,
            {
                expiresAt: expiresAt
            }
        );


        console.log(
            "Admin oturumu açıldı 🌿"
        );


        res.status(200).json({

            success: true,

            message:
                "Giriş başarılı.",

            token:
                token,

            expiresAt:
                expiresAt

        });

    }
);

// ==============================
// ADMIN ÇIKIŞ
// ==============================

app.post(
    "/api/admin/logout",

    requireAdmin,

    (req, res) => {

        adminSessions.delete(
            req.adminToken
        );


        console.log(
            "Admin oturumu kapatıldı 🌿"
        );


        res.status(200).json({

            success: true,

            message:
                "Çıkış başarılı."

        });

    }

);


// ==============================
// YENİ SİPARİŞ OLUŞTURMA
// ==============================

// ==============================
// YENİ SİPARİŞ OLUŞTURMA
// SQLITE
// ==============================

app.post("/api/orders", async (req, res) => {

    const {
        customerName,
        phone,
        address,
        product,
        quantity
    } = req.body;


    // Eksik bilgi kontrolü
    if (
        !customerName ||
        !phone ||
        !address ||
        !product ||
        !quantity
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Lütfen tüm sipariş bilgilerini doldurun."

        });

    }


    try {

        // İşlemi başlat
        db.exec("BEGIN IMMEDIATE");


        const currentYear =
            new Date().getFullYear();


        // Bu yıldaki en büyük sipariş sırasını bul
        const sequenceResult = db.prepare(`

            SELECT MAX(

                CAST(
                    SUBSTR(order_number, 10)
                    AS INTEGER
                )

            ) AS max_sequence

            FROM orders

            WHERE order_number LIKE ?

        `).get(`OLV-${currentYear}-%`);


        const nextSequence =
            Number(
                sequenceResult.max_sequence || 0
            ) + 1;


        const orderNumber =
            `OLV-${currentYear}-${String(
                nextSequence
            ).padStart(4, "0")}`;


        const createdAt =
            new Date().toISOString();


        // Siparişi veritabanına ekle
        const result = db.prepare(`

            INSERT INTO orders (

                order_number,
                customer_name,
                phone,
                address,
                product,
                quantity,
                status,
                created_at

            )

            VALUES (?, ?, ?, ?, ?, ?, ?, ?)

        `).run(

            orderNumber,

            customerName,

            phone,

            address,

            product,

            quantity,

            "Yeni Sipariş",

            createdAt

        );


        db.exec("COMMIT");


        const newOrder = {

            id:
                Number(result.lastInsertRowid),

            orderNumber:
                orderNumber,

            customerName:
                customerName,

            phone:
                phone,

            address:
                address,

            product:
                product,

            quantity:
                quantity,

            status:
                "Yeni Sipariş",

            createdAt:
                createdAt

        };

        // ==============================
// YENİ SİPARİŞ MAİL BİLDİRİMİ
// ==============================

try {

    await transporter.sendMail({

        from:
            `"Olivada Sipariş Sistemi" <${process.env.EMAIL_USER}>`,

        to:
            process.env.EMAIL_TO,

        subject:
            `Yeni Sipariş - ${orderNumber}`,

        text: `
Yeni bir Olivada siparişi oluşturuldu.

Sipariş No: ${orderNumber}

MÜŞTERİ BİLGİLERİ

Ad Soyad: ${customerName}
Telefon: ${phone}
Adres: ${address}


SİPARİŞ BİLGİLERİ

Ürün: ${product}
Miktar: ${quantity}

Durum: Yeni Sipariş

Sipariş Tarihi:
${new Date(createdAt).toLocaleString("tr-TR")}
        `.trim()

    });


    console.log(
        "Sipariş bildirim maili gönderildi:",
        orderNumber
    );


} catch (mailError) {

    console.error(
        "Sipariş kaydedildi ancak bildirim maili gönderilemedi:",
        mailError.message
    );

}


        // WhatsApp mesajı

        const whatsappMessage = `
Merhaba Olivada,

Yeni bir sipariş oluşturmak istiyorum.

Sipariş No: ${orderNumber}
Ad Soyad: ${customerName}
Telefon: ${phone}
Adres: ${address}

Ürün: ${product}
Miktar: ${quantity}

Siparişim hakkında bilgi alabilir miyim?
        `.trim();


        const whatsappUrl =

            `https://wa.me/${process.env.WHATSAPP_NUMBER}` +

            `?text=${encodeURIComponent(
                whatsappMessage
            )}`;


        console.log(
            "Yeni sipariş SQLite'a kaydedildi:",
            orderNumber
        );


        res.status(201).json({

            success: true,

            message:
                "Sipariş başarıyla kaydedildi.",

            order:
                newOrder,

            whatsappUrl:
                whatsappUrl

        });


    } catch (error) {

        // Transaction açıksa geri al
        try {

            db.exec("ROLLBACK");

        } catch (rollbackError) {

            console.error(
                "Rollback hatası:",
                rollbackError
            );

        }


        console.error(
            "Sipariş oluşturma hatası:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Sipariş oluşturulamadı."

        });

    }

});


// ==============================
// TÜM SİPARİŞLERİ GETİRME
// ==============================

// ==============================
// TÜM SİPARİŞLERİ GETİRME
// SQLITE
// ==============================

app.get(
    "/api/orders",
    requireAdmin,
    (req, res) => {

        try {

            const rows = db.prepare(`

                SELECT *

                FROM orders

                ORDER BY
                    created_at ASC,
                    id ASC

            `).all();


            const orders =
                rows.map(mapOrder);


            res.status(200).json({

                success: true,

                orders: orders

            });


        } catch (error) {

            console.error(
                "Siparişleri okuma hatası:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Siparişler okunamadı."

            });

        }

    }
);

// ==============================
// SİPARİŞ DURUMU GÜNCELLEME
// ==============================

// ==============================
// SİPARİŞ DURUMU GÜNCELLEME
// SQLITE
// ==============================

app.patch(
    "/api/orders/:id/status",
    requireAdmin,
    (req, res) => {

        const { status } = req.body;


        const allowedStatuses = [

            "Yeni Sipariş",
            "Hazırlanıyor",
            "Kargoya Verildi",
            "Tamamlandı",
            "İptal Edildi"

        ];


        if (
            !allowedStatuses.includes(status)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Geçersiz sipariş durumu."

            });

        }


        try {

            const result = db.prepare(`

                UPDATE orders

                SET status = ?

                WHERE id = ?

            `).run(

                status,

                req.params.id

            );


            if (
                Number(result.changes) === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Sipariş bulunamadı."

                });

            }


            const updatedRow = db.prepare(`

                SELECT *

                FROM orders

                WHERE id = ?

            `).get(req.params.id);


            const updatedOrder =
                mapOrder(updatedRow);


            console.log(

                "Sipariş durumu değişti:",

                updatedOrder.orderNumber,

                "→",

                status

            );


            res.status(200).json({

                success: true,

                message:
                    "Sipariş durumu güncellendi.",

                order:
                    updatedOrder

            });


        } catch (error) {

            console.error(
                "Durum güncelleme hatası:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Sipariş durumu güncellenemedi."

            });

        }

    }
);

// ==============================
// SUNUCU
// ==============================

// ==============================
// SİPARİŞ SİLME
// ==============================

// ==============================
// SİPARİŞ SİLME
// SQLITE
// ==============================

app.delete(
    "/api/orders/:id",
    requireAdmin,
    (req, res) => {

        try {

            const existingOrder =
                db.prepare(`

                    SELECT *

                    FROM orders

                    WHERE id = ?

                `).get(req.params.id);


            if (!existingOrder) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Sipariş bulunamadı."

                });

            }


            const result =
                db.prepare(`

                    DELETE FROM orders

                    WHERE id = ?

                `).run(req.params.id);


            if (
                Number(result.changes) === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Sipariş bulunamadı."

                });

            }


            console.log(

                "Sipariş silindi:",

                existingOrder.order_number

            );


            res.status(200).json({

                success: true,

                message:
                    "Sipariş silindi."

            });


        } catch (error) {

            console.error(
                "Sipariş silme hatası:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Sipariş silinemedi."

            });

        }

    }
);

app.listen(PORT, () => {

    console.log(
        `Olivada backend http://localhost:${PORT} adresinde çalışıyor`
    );

});