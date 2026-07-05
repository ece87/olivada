const contactForm = document.getElementById("contactForm");
const formMessage = document.getElementById("formMessage");


contactForm.addEventListener("submit", async function (event) {

    // Sayfanın yenilenmesini engeller
    event.preventDefault();


    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const message = document.getElementById("message").value;


    const formData = {
        name: name,
        email: email,
        message: message
    };


    try {

        const response = await fetch(
            "http://localhost:3000/api/contact",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(formData)
            }
        );


        const data = await response.json();


        if (response.ok) {

            formMessage.textContent =
                "Mesajınız başarıyla gönderildi 🌿";

            contactForm.reset();

        } else {

            formMessage.textContent =
                "Mesaj gönderilirken bir hata oluştu.";

        }


    } catch (error) {

        console.error(error);

        formMessage.textContent =
            "Sunucuya bağlanılamadı.";

    }

});