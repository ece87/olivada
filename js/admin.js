const API_URL = "http://localhost:3000/api";


const loginSection =
    document.getElementById("loginSection");

const adminPanel =
    document.getElementById("adminPanel");

const loginForm =
    document.getElementById("loginForm");

const loginMessage =
    document.getElementById("loginMessage");

const ordersContainer =
    document.getElementById("ordersContainer");

const logoutButton =
    document.getElementById("logoutButton");
const orderSearch =
    document.getElementById("orderSearch");

const statusFilter =
    document.getElementById("statusFilter");
const orderModal =
    document.getElementById("orderModal");

const orderModalBody =
    document.getElementById("orderModalBody");

const closeOrderModal =
    document.getElementById("closeOrderModal");


let allOrders = [];


// ==============================
// GİRİŞ
// ==============================

loginForm.addEventListener(
    "submit",

    async function (event) {

        event.preventDefault();


        const password =
            document.getElementById(
                "adminPassword"
            ).value;


        try {

            const response = await fetch(
                `${API_URL}/admin/login`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({
                        password: password
                    })

                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                loginMessage.textContent =
                    data.message;

                return;

            }


            sessionStorage.setItem(
                "adminToken",
                data.token
            );


            showAdminPanel();


        } catch (error) {

            console.error(error);

            loginMessage.textContent =
                "Sunucuya bağlanılamadı.";

        }

    }
);


// ==============================
// PANELİ GÖSTER
// ==============================

function showAdminPanel() {

    loginSection.hidden = true;

    adminPanel.hidden = false;

    loadOrders();
}


// ==============================
// SİPARİŞLERİ GETİR
// ==============================

async function loadOrders() {

    const token =
        sessionStorage.getItem("adminToken");


    try {

        const response = await fetch(
            `${API_URL}/orders`,
            {

                headers: {

                    Authorization:
                        `Bearer ${token}`

                }

            }
        );


        if (response.status === 401) {

            sessionStorage.removeItem(
                "adminToken"
            );

            loginSection.hidden = false;

            adminPanel.hidden = true;

            loginMessage.textContent =
                "Oturum sona erdi. Tekrar giriş yapın.";

            return;

        }


        const data =
            await response.json();

allOrders = data.orders;

updateStats(allOrders);

applyFilters();

    } catch (error) {

        console.error(error);

        ordersContainer.textContent =
            "Siparişler yüklenemedi.";

    }

}


// ==============================
// SİPARİŞLERİ EKRANA YAZ
// ==============================
// ==============================
// İSTATİSTİKLER
// ==============================

function updateStats(orders) {

    const total =
        orders.length;


    const newCount =
        orders.filter(function (order) {

            return order.status === "Yeni Sipariş";

        }).length;


    const preparingCount =
        orders.filter(function (order) {

            return order.status === "Hazırlanıyor";

        }).length;


    const completedCount =
        orders.filter(function (order) {

            return order.status === "Tamamlandı";

        }).length;


    document.getElementById(
        "totalOrders"
    ).textContent = total;


    document.getElementById(
        "newOrders"
    ).textContent = newCount;


    document.getElementById(
        "preparingOrders"
    ).textContent = preparingCount;


    document.getElementById(
        "completedOrders"
    ).textContent = completedCount;

}
// ==============================
// ARAMA VE FİLTRELEME
// ==============================

function applyFilters() {

    const searchText =
        orderSearch.value
            .trim()
            .toLocaleLowerCase("tr-TR");


    const selectedStatus =
        statusFilter.value;


    const filteredOrders =
        allOrders.filter(function (order) {

            const searchableText = `

                ${order.customerName || ""}
                ${order.phone || ""}
                ${order.address || ""}
                ${order.product || ""}
                ${order.quantity || ""}

            `.toLocaleLowerCase("tr-TR");


            const matchesSearch =
                searchableText.includes(searchText);


            const matchesStatus =
                selectedStatus === "all" ||
                order.status === selectedStatus;


            return (
                matchesSearch &&
                matchesStatus
            );

        });


    renderOrders(filteredOrders);

}

// ==============================
// SİPARİŞ DETAY PENCERESİ
// ==============================

function openOrderDetails(order) {

    const orderNumberText =
        order.orderNumber ||
        `#${order.id}`;


    orderModalBody.innerHTML = `
        <div class="modal-detail-row">
            <span>Sipariş No</span>
            <strong>${orderNumberText}</strong>
        </div>

        <div class="modal-detail-row">
            <span>Müşteri</span>
            <strong>${order.customerName}</strong>
        </div>

        <div class="modal-detail-row">
            <span>Telefon</span>
            <strong>${order.phone}</strong>
        </div>

        <div class="modal-detail-row">
            <span>Adres</span>
            <strong>${order.address}</strong>
        </div>

        <div class="modal-detail-row">
            <span>Ürün</span>
            <strong>${order.product}</strong>
        </div>

        <div class="modal-detail-row">
            <span>Miktar</span>
            <strong>${order.quantity}</strong>
        </div>

        <div class="modal-detail-row">
            <span>Durum</span>
            <strong>${order.status}</strong>
        </div>

        <div class="modal-detail-row">
            <span>Tarih</span>
            <strong>
                ${new Date(order.createdAt).toLocaleString("tr-TR")}
            </strong>
        </div>
    `;


    orderModal.hidden = false;

    document.body.classList.add(
        "modal-open"
    );

}

function renderOrders(orders) {

    ordersContainer.innerHTML = "";


    if (!orders || orders.length === 0) {

    const emptyMessage =
        document.createElement("p");

    emptyMessage.className =
        "no-orders-message";

    emptyMessage.textContent =
        "Arama veya filtre kriterlerine uygun sipariş bulunamadı.";

    ordersContainer.appendChild(
        emptyMessage
    );

    return;
}


    const reversedOrders =
        [...orders].reverse();


    reversedOrders.forEach(function (order) {

        const card =
            document.createElement("article");

        card.className = "admin-order-card";


        const title =
            document.createElement("h2");

        title.textContent =
            `${order.product} - ${order.quantity}`;


        const customer =
            document.createElement("p");

        customer.textContent =
            `Müşteri: ${order.customerName}`;


        const phone =
            document.createElement("p");

        phone.textContent =
            `Telefon: ${order.phone}`;


        const address =
            document.createElement("p");

        address.textContent =
            `Adres: ${order.address}`;


        const date =
            document.createElement("p");

        date.textContent =
            `Tarih: ${new Date(
                order.createdAt
            ).toLocaleString("tr-TR")}`;


        const statusLabel =
            document.createElement("label");

        statusLabel.textContent =
            "Sipariş Durumu: ";


        const statusSelect =
            document.createElement("select");


        const statuses = [

            "Yeni Sipariş",
            "Hazırlanıyor",
            "Kargoya Verildi",
            "Tamamlandı",
            "İptal Edildi"

        ];


        statuses.forEach(function (status) {

            const option =
                document.createElement("option");

            option.value = status;

            option.textContent = status;


            if (status === order.status) {

                option.selected = true;

            }


            statusSelect.appendChild(option);

        });


        statusSelect.addEventListener(
            "change",

            function () {

                updateOrderStatus(
                    order.id,
                    statusSelect.value
                );

            }
        );


        statusLabel.appendChild(
            statusSelect
        );


        // Sipariş numarası

const orderNumber =
    document.createElement("p");

orderNumber.className =
    "order-number";

orderNumber.textContent =
    order.orderNumber
        ? `Sipariş No: ${order.orderNumber}`
        : `Eski Sipariş No: #${order.id}`;

console.log("Sipariş kartı oluşturuluyor:", order.id);


// Buton alanı

const actionButtons =
    document.createElement("div");

// Detay butonu

const detailButton =
    document.createElement("button");

detailButton.className =
    "order-detail-button";

detailButton.textContent =
    "Detayları Gör";


detailButton.addEventListener(
    "click",

    function () {

        openOrderDetails(order);

    }
);

actionButtons.className =
    "order-actions";


// WhatsApp butonu

const whatsappButton =
    document.createElement("a");

whatsappButton.className =
    "customer-whatsapp-button";

whatsappButton.textContent =
    "WhatsApp'tan Yaz";

whatsappButton.href =
    createCustomerWhatsappUrl(
        order.phone,
        order.customerName
    );

whatsappButton.target =
    "_blank";

whatsappButton.rel =
    "noopener noreferrer";


    // Durum mesajı butonu

const statusMessageButton =
    document.createElement("a");


statusMessageButton.className =
    "status-message-button";


statusMessageButton.textContent =
    "Durum Mesajı Gönder";


statusMessageButton.href =
    createStatusWhatsappUrl(

        order.phone,

        order.customerName,

        order.orderNumber,

        order.status

    );


statusMessageButton.target =
    "_blank";


statusMessageButton.rel =
    "noopener noreferrer";

// Sil butonu

const deleteButton =
    document.createElement("button");

deleteButton.className =
    "delete-order-button";

deleteButton.textContent =
    "Siparişi Sil";


deleteButton.addEventListener(
    "click",

    function () {

        deleteOrder(order.id);

    }
);


// Butonları alana ekle

actionButtons.appendChild(
    detailButton
);

actionButtons.appendChild(
    whatsappButton
);

actionButtons.appendChild(
    statusMessageButton
);

actionButtons.appendChild(
    deleteButton
);


// Kartı oluştur

card.appendChild(orderNumber);

card.appendChild(title);

card.appendChild(customer);

card.appendChild(phone);

card.appendChild(address);

card.appendChild(date);

card.appendChild(statusLabel);

card.appendChild(actionButtons);


ordersContainer.appendChild(card);

    });

}


// ==============================
// DURUM GÜNCELLEME
// ==============================

async function updateOrderStatus(
    orderId,
    newStatus
) {

    const token =
        sessionStorage.getItem("adminToken");


    try {

        const response = await fetch(

            `${API_URL}/orders/${orderId}/status`,

            {

                method: "PATCH",

                headers: {

                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${token}`

                },

                body: JSON.stringify({

                    status: newStatus

                })

            }
        );


        const data =
            await response.json();


        if (response.ok) {

            console.log(
                "Durum güncellendi:",
                data.order
            );

            loadOrders();
        } else {

            alert(data.message);

            loadOrders();

        }


    } catch (error) {

        console.error(error);

        alert(
            "Sipariş durumu güncellenemedi."
        );

        loadOrders();

    }

}

// ==============================
// SİPARİŞ SİLME
// ==============================

async function deleteOrder(orderId) {

    const confirmDelete =
        confirm(
            "Bu siparişi silmek istediğinize emin misiniz?"
        );


    if (!confirmDelete) {
        return;
    }


    const token =
        sessionStorage.getItem("adminToken");


    try {

        const response = await fetch(

            `${API_URL}/orders/${orderId}`,

            {

                method: "DELETE",

                headers: {

                    Authorization:
                        `Bearer ${token}`

                }

            }

        );


        const data =
            await response.json();


        if (response.ok) {

            await loadOrders();

        } else {

            alert(data.message);

        }


    } catch (error) {

        console.error(error);

        alert(
            "Sipariş silinirken hata oluştu."
        );

    }

}

// ==============================
// MÜŞTERİ WHATSAPP BAĞLANTISI
// ==============================

function createCustomerWhatsappUrl(
    phone,
    customerName
) {

    let cleanPhone =
        String(phone || "")
            .replace(/\D/g, "");


    // 0555... formatındaysa
    if (cleanPhone.startsWith("0")) {

        cleanPhone =
            "90" + cleanPhone.slice(1);

    }

    // 555... formatındaysa
    else if (!cleanPhone.startsWith("90")) {

        cleanPhone =
            "90" + cleanPhone;

    }


    const message = `
Merhaba ${customerName},

Olivada siparişiniz hakkında sizinle iletişime geçiyoruz.
    `.trim();


    return (
        `https://wa.me/${cleanPhone}` +
        `?text=${encodeURIComponent(message)}`
    );

}


// ==============================
// SİPARİŞ DURUMU WHATSAPP MESAJI
// ==============================

function createStatusWhatsappUrl(
    phone,
    customerName,
    orderNumber,
    status
) {

    let cleanPhone =
        String(phone || "")
            .replace(/\D/g, "");


    // 0555... formatı
    if (cleanPhone.startsWith("0")) {

        cleanPhone =
            "90" + cleanPhone.slice(1);

    }

    // 555... formatı
    else if (!cleanPhone.startsWith("90")) {

        cleanPhone =
            "90" + cleanPhone;

    }


    let statusMessage = "";


    switch (status) {

        case "Yeni Sipariş":

            statusMessage =
                "Siparişiniz başarıyla alınmıştır.";

            break;


        case "Hazırlanıyor":

            statusMessage =
                "Siparişiniz hazırlanmaya başlanmıştır.";

            break;


        case "Kargoya Verildi":

            statusMessage =
                "Siparişiniz kargoya verilmiştir.";

            break;


        case "Tamamlandı":

            statusMessage =
                "Siparişiniz tamamlanmıştır. Bizi tercih ettiğiniz için teşekkür ederiz.";

            break;


        case "İptal Edildi":

            statusMessage =
                "Siparişiniz iptal edilmiştir. Detaylı bilgi için bizimle iletişime geçebilirsiniz.";

            break;


        default:

            statusMessage =
                `Sipariş durumunuz: ${status}`;

    }


    const numberText =
        orderNumber || "Siparişiniz";


    const message = `
Merhaba ${customerName},

${numberText} numaralı siparişiniz hakkında bilgilendirme:

${statusMessage}

Olivada
    `.trim();


    return (
        `https://wa.me/${cleanPhone}` +
        `?text=${encodeURIComponent(message)}`
    );

}

// ==============================
// ÇIKIŞ
// ==============================

orderSearch.addEventListener(
    "input",
    applyFilters
);


statusFilter.addEventListener(
    "change",
    applyFilters
);

logoutButton.addEventListener(
    "click",

    async function () {

        const token =
            sessionStorage.getItem(
                "adminToken"
            );


        try {

            if (token) {

                await fetch(
                    `${API_URL}/admin/logout`,
                    {

                        method: "POST",

                        headers: {

                            Authorization:
                                `Bearer ${token}`

                        }

                    }
                );

            }

        } catch (error) {

            console.error(
                "Çıkış isteği gönderilemedi:",
                error
            );

        } finally {

            sessionStorage.removeItem(
                "adminToken"
            );


            adminPanel.hidden = true;

            loginSection.hidden = false;

            loginForm.reset();

            loginMessage.textContent =
                "Çıkış yapıldı.";

        }

    }

);


// Daha önce giriş yapıldıysa
if (
    sessionStorage.getItem("adminToken")
) {

    showAdminPanel();

}

// ==============================
// MODAL KAPATMA
// ==============================

function closeModal() {

    orderModal.hidden = true;

    document.body.classList.remove(
        "modal-open"
    );

}


closeOrderModal.addEventListener(
    "click",
    closeModal
);


orderModal.addEventListener(
    "click",

    function (event) {

        if (event.target === orderModal) {

            closeModal();

        }

    }
);


document.addEventListener(
    "keydown",

    function (event) {

        if (
            event.key === "Escape" &&
            !orderModal.hidden
        ) {

            closeModal();

        }

    }
);