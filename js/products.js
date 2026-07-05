const orderForm = document.getElementById("orderForm");
const productSelect = document.getElementById("product");
const quantitySelect = document.getElementById("quantity");
const orderMessage = document.getElementById("orderMessage");
const orderSection = document.getElementById("orderSection");
const orderButtons = document.querySelectorAll(".order-button");


// Ürünlere göre miktarlar
const quantityOptions = {
    "Zeytinyağı": [
        "1 Litre",
        "2 Litre",
        "5 Litre"
    ],

    "Zeytin": [
        "1 KG",
        "2 KG",
        "5 KG"
    ],

    "Salamura Zeytin": [
        "1 KG",
        "2 KG",
        "5 KG"
    ]
};


// Sipariş Ver butonları
orderButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        const selectedProduct =
            button.getAttribute("data-product");

        productSelect.value = selectedProduct;

        updateQuantityOptions(selectedProduct);

        orderSection.scrollIntoView({
            behavior: "smooth"
        });

    });

});


// Ürün değişince miktarları güncelle
productSelect.addEventListener("change", function () {

    updateQuantityOptions(productSelect.value);

});


function updateQuantityOptions(product) {

    quantitySelect.innerHTML = "";


    if (!product || !quantityOptions[product]) {

        quantitySelect.innerHTML = `
            <option value="">
                Önce ürün seçiniz
            </option>
        `;

        return;
    }


    const defaultOption =
        document.createElement("option");

    defaultOption.value = "";

    defaultOption.textContent =
        "Miktar seçiniz";

    quantitySelect.appendChild(defaultOption);


    quantityOptions[product].forEach(function (quantity) {

        const option =
            document.createElement("option");

        option.value = quantity;

        option.textContent = quantity;

        quantitySelect.appendChild(option);

    });

}


// SİPARİŞ GÖNDERME
orderForm.addEventListener("submit", async function (event) {

    event.preventDefault();


    const orderData = {

        customerName:
            document.getElementById("customerName").value,

        phone:
            document.getElementById("phone").value,

        address:
            document.getElementById("address").value,

        product:
            productSelect.value,

        quantity:
            quantitySelect.value

    };


    try {

        const response = await fetch(
            "http://localhost:3000/api/orders",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(orderData)
            }
        );


        const data = await response.json();

        console.log("Backend cevabı:", data);


        if (response.ok) {

            orderMessage.innerHTML = `
                <p>
                    Siparişiniz kaydedildi 🌿
                </p>

                <a
                    href="${data.whatsappUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="
                        display: inline-block;
                        margin-top: 15px;
                        padding: 12px 20px;
                        background-color: #25D366;
                        color: white;
                        text-decoration: none;
                        border-radius: 8px;
                    "
                >
                    WhatsApp ile Siparişi Tamamla
                </a>
            `;


            orderForm.reset();


            quantitySelect.innerHTML = `
                <option value="">
                    Önce ürün seçiniz
                </option>
            `;

        } else {

            orderMessage.textContent =
                data.message ||
                "Sipariş oluşturulamadı.";

        }


    } catch (error) {

        console.error("Hata:", error);

        orderMessage.textContent =
            "Sunucuya bağlanılamadı.";

    }

});