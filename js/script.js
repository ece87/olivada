const container = document.querySelector(".olive-rain");

function createOlive() {
    const olive = document.createElement("div");
    olive.className = "olive";

    olive.style.width = "250px";
    olive.style.height = "250px";
    olive.style.opacity = 0.30;

    const startSide = Math.floor(Math.random() * 4);

    let x, y, moveX, moveY;

    if (startSide === 0) {
        x = Math.random() * window.innerWidth;
        y = -120;
        moveX = (Math.random() - 0.5) * 2.5;
        moveY = 0.5;
    } else if (startSide === 1) {
        x = -120;
        y = Math.random() * window.innerHeight;
        moveX = 0.9;
        moveY = (Math.random() - 0.2) * 0.8;
    } else if (startSide === 2) {
        x = window.innerWidth + 120;
        y = Math.random() * window.innerHeight;
        moveX = -0.9;
        moveY = (Math.random() - 0.2) * 0.8;
    } else {
        x = Math.random() * window.innerWidth;
        y = window.innerHeight + 120;
        moveX = (Math.random() - 0.5) * 2;
        moveY = -0.5;
    }

    olive.style.left = x + "px";
    olive.style.top = y + "px";

    container.appendChild(olive);

    let rotate = Math.random() * 360;
    const wave = Math.random() * 2 + 1;

    function animate() {
        x += moveX + Math.sin(Date.now() / 700) * wave * 0.15;
        y += moveY;

        rotate += 0.20;

        olive.style.left = x + "px";
        olive.style.top = y + "px";
        olive.style.transform = `rotate(${rotate}deg)`;

        if (
            y > -200 &&
            y < window.innerHeight + 200 &&
            x > -200 &&
            x < window.innerWidth + 200
        ) {
            requestAnimationFrame(animate);
        } else {
            olive.remove();
        }
    }

    animate();
}

for (let i = 0; i < 5; i++) {
    setTimeout(createOlive, i * 180);
}

setInterval(createOlive, 1500);

const products = {
    zeytin: {
        title: "Zeytin",
        description: "Doğal yöntemlerle hazırlanmış kahvaltılık zeytin çeşididir.",
        price: "450 TL / KG",
        image: "images/zeytin.png",
        message: "Merhaba, Olivada zeytin ürünü için kilogram üzerinden sipariş vermek istiyorum."
    },

    zeytinyagi: {
        title: "Zeytinyağı",
        description: "Yemeklerde, salatalarda ve kahvaltılarda kullanılabilen doğal zeytinyağıdır.",
        price: "500 TL / KG",
        image: "images/zeytinyagi.png",
        message: "Merhaba, Olivada zeytinyağı ürünü için kilogram üzerinden sipariş vermek istiyorum."
    },

    salamura: {
        title: "Salamura",
        description: "Geleneksel yöntemlerle hazırlanmış salamura zeytin ürünüdür.",
        price: "500 TL / KG",
        image: "images/salamura.png",
        message: "Merhaba, Olivada salamura ürünü için kilogram üzerinden sipariş vermek istiyorum."
    }
};

const detailButtons = document.querySelectorAll(".detail-btn");

const productPopup = document.getElementById("productPopup");
const closePopup = document.getElementById("closePopup");

const popupImage = document.getElementById("popupImage");
const popupTitle = document.getElementById("popupTitle");
const popupDescription = document.getElementById("popupDescription");
const popupPrice = document.getElementById("popupPrice");

const whatsappOrder = document.getElementById("whatsappOrder");
const instagramOrder = document.getElementById("instagramOrder");

/* Buraya kendi WhatsApp numaranı yazacaksın */
const whatsappNumber = "905551112233";

/* Buraya kendi Instagram kullanıcı adını yazacaksın */
const instagramUsername = "olivada";

detailButtons.forEach(function(button) {
    button.addEventListener("click", function() {
        const productName = button.getAttribute("data-product");
        const selectedProduct = products[productName];

        popupImage.src = selectedProduct.image;
        popupImage.alt = selectedProduct.title;

        popupTitle.textContent = selectedProduct.title;
        popupDescription.textContent = selectedProduct.description;
        popupPrice.textContent = selectedProduct.price;

        const whatsappMessage = encodeURIComponent(selectedProduct.message);

        whatsappOrder.href = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
        instagramOrder.href = `https://www.instagram.com/${instagramUsername}`;

        productPopup.classList.add("active");
    });
});

closePopup.addEventListener("click", function() {
    productPopup.classList.remove("active");
});

productPopup.addEventListener("click", function(e) {
    if (e.target === productPopup) {
        productPopup.classList.remove("active");
    }
});const contactForm = document.getElementById("contactForm");
const formMessage = document.getElementById("formMessage");

if (contactForm && formMessage) {
    contactForm.addEventListener("submit", function(e) {
        e.preventDefault();

        formMessage.textContent = "Mesajınız alındı. En kısa sürede dönüş yapılacaktır.";
        formMessage.classList.add("show");

        contactForm.reset();
    });
}