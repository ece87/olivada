const crypto = require("node:crypto");
const readline = require("node:readline/promises");

const {
    stdin: input,
    stdout: output
} = require("node:process");


async function generateHash() {

    const rl = readline.createInterface({
        input,
        output
    });


    const password =
        await rl.question(
            "Yeni admin şifresini yazın: "
        );


    if (password.length < 12) {

        console.log(
            "Şifre en az 12 karakter olmalı."
        );

        rl.close();

        return;

    }


    const salt =
        crypto
            .randomBytes(16)
            .toString("hex");


    const hash =
        crypto
            .scryptSync(
                password,
                salt,
                64
            )
            .toString("hex");


    console.log("\n.env dosyasına ekleyin:\n");


    console.log(
        `ADMIN_PASSWORD_SALT=${salt}`
    );


    console.log(
        `ADMIN_PASSWORD_HASH=${hash}`
    );


    rl.close();

}


generateHash();