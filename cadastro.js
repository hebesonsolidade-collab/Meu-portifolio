const formCadastro = document.getElementById("cadastroForm");
const nomeInput = document.getElementById("nome");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");
const mensagem = document.getElementById("mensagem");

formCadastro.addEventListener("submit", async function (event) {
    event.preventDefault();

    const nome = nomeInput.value.trim();
    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    mensagem.textContent = "";

    if (senha.length < 6) {
        mensagem.textContent = "A senha deve ter pelo menos 6 caracteres.";
        mensagem.style.color = "red";
        return;
    }

    try {
        mensagem.textContent = "Realizando cadastro...";
        mensagem.style.color = "#555";

        const resposta = await fetch("http://127.0.0.1:3000/cadastro", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nome: nome, email: email, senha: senha })
        });

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

        if (dados.sucesso) {
            mensagem.textContent = "Cadastro realizado com sucesso! Redirecionando...";
            mensagem.style.color = "green";

            setTimeout(function () {
                window.location.href = "index.html";
            }, 1000);

        } else {
            mensagem.textContent = dados.mensagem || "Erro ao realizar cadastro.";
            mensagem.style.color = "red";
        }

    } catch (erro) {
        console.error("Erro ao realizar cadastro:", erro);
        mensagem.textContent = "Não foi possível conectar ao servidor.";
        mensagem.style.color = "red";
    }
});