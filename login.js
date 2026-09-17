console.log("LOGIN.JS FOI CARREGADO!");

const formulario = document.getElementById("loginForm");
const mensagem = document.getElementById("mensagem");

formulario.addEventListener("submit", async function (event) {

    event.preventDefault();

    const usuario =
        document.getElementById("login").value.trim();

    const senha =
        document.getElementById("senha").value.trim();

    if (usuario === "" || senha === "") {

        mensagem.textContent =
            "Preencha usuário e senha.";

        mensagem.style.color = "red";

        return;
    }

    mensagem.textContent = "Verificando...";
    mensagem.style.color = "white";

    try {

        console.log("Enviando login...");
        console.log("Usuário:", usuario);

        const resposta = await fetch(
            "http://127.0.0.1:3000/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    usuario: usuario,
                    senha: senha
                })
            }
        );

        let dados;

        const textoResposta = await resposta.text();

        try {
            dados = JSON.parse(textoResposta);
        } catch (erroParse) {

            console.error(
                "Resposta não é um JSON válido (status " + resposta.status + "):",
                textoResposta
            );

            mensagem.textContent =
                "Servidor respondeu de forma inesperada (status " +
                resposta.status +
                "). Verifique se o servidor está rodando.";

            mensagem.style.color = "red";

            return;
        }

        console.log(
            "Resposta do servidor:",
            dados
        );

        if (dados.sucesso) {

            mensagem.textContent =
                "Login realizado com sucesso!";

            mensagem.style.color = "green";

            localStorage.setItem(
                "usuario",
                dados.usuario
            );

            localStorage.setItem(
                "email",
                dados.email
            );

            localStorage.setItem(
                "id",
                dados.id
            );

            setTimeout(function () {

                window.location.href = "INDEX.HTML";

            }, 800);

        } else {

            mensagem.textContent =
                dados.mensagem;

            mensagem.style.color = "red";
        }

    } catch (erro) {

        console.error("❌ ERRO:", erro);

        mensagem.textContent =
            "Erro ao conectar com o servidor.";

        mensagem.style.color = "red";
    }

});


// CANCELAR
function cancelar() {

    document.getElementById("login").value = "";
    document.getElementById("senha").value = "";

    mensagem.textContent = "";
}