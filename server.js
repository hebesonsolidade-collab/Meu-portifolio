const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const PORT = 3000;

function origemLocal(origem) {
    if (!origem || origem === "null") {
        return true;
    }

    let partes;
    try {
        partes = new URL(origem);
    } catch (erro) {
        return false;
    }

    const host = partes.hostname;

    if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
        return true;
    }

    if (/^10\./.test(host)) {
        return true;
    }

    if (/^192\.168\./.test(host)) {
        return true;
    }

    if (/^172\.(1[6-9]|2[0-9]|3[01])\./.test(host)) {
        return true;
    }

    return false;
}

app.use(cors({
    origin: function (origem, callback) {
        if (origemLocal(origem)) {
            return callback(null, true);
        }

        return callback(new Error("Origem bloqueada pelo CORS."));
    }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CONEXÃO COM MYSQL
const banco = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "123456",
    database: "ACESSOPORTI",
    port: 3306
});

banco.connect(function (erro) {
    if (erro) {
        console.log("❌ ERRO AO CONECTAR AO MYSQL");
        console.log(erro.message);
        return;
    }

    console.log("=================================");
    console.log("✅ MYSQL CONECTADO!");
    console.log("=================================");
});

// TESTE
app.get("/teste", function (req, res) {
    res.status(200).json({
        sucesso: true,
        mensagem: "Servidor funcionando!"
    });
});

// LOGIN
app.post("/login", function (req, res) {

    console.log("=================================");
    console.log("📥 LOGIN RECEBIDO");
    console.log("=================================");

    const email = req.body.usuario;
    const senha = req.body.senha;

    console.log("Email recebido:", email);

    if (!email || !senha) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "Preencha usuário e senha."
        });
    }

    const sql = `
        SELECT id, nome, email
        FROM usuarios
        WHERE email = ?
        AND senha = ?
    `;

    banco.query(
        sql,
        [email, senha],
        function (erro, resultado) {

            if (erro) {
                console.log("❌ ERRO NO MYSQL");
                console.log(erro.message);

                return res.status(500).json({
                    sucesso: false,
                    mensagem: "Erro ao consultar o banco."
                });
            }

            console.log(
                "Usuários encontrados:",
                resultado.length
            );

            if (resultado.length === 0) {

                console.log("❌ EMAIL OU SENHA INCORRETOS");

                return res.status(401).json({
                    sucesso: false,
                    mensagem: "Usuário ou senha incorretos."
                });
            }

            const dados = resultado[0];

            console.log("✅ LOGIN CORRETO!");
            console.log("Nome:", dados.nome);
            console.log("Email:", dados.email);

            return res.status(200).json({

                sucesso: true,

                mensagem: "Login realizado com sucesso!",

                id: dados.id,

                usuario: dados.nome,

                email: dados.email
            });
        }
    );
});

// CADASTRO
app.post("/cadastro", function (req, res) {

    console.log("=================================");
    console.log("📥 CADASTRO RECEBIDO");
    console.log("=================================");

    const nome = req.body.nome;
    const email = req.body.email;
    const senha = req.body.senha;

    if (!nome || !email || !senha) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "Preencha nome, email e senha."
        });
    }

    const sql = `
        INSERT INTO usuarios (nome, email, senha)
        VALUES (?, ?, ?)
    `;

    banco.query(
        sql,
        [nome, email, senha],
        function (erro, resultado) {

            if (erro) {
                console.log("❌ ERRO NO MYSQL");
                console.log(erro.message);

                if (erro.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        sucesso: false,
                        mensagem: "Este email já está cadastrado."
                    });
                }

                return res.status(500).json({
                    sucesso: false,
                    mensagem: "Erro ao salvar no banco."
                });
            }

            console.log("✅ CADASTRO REALIZADO!");
            console.log("Registered:", resultado.insertId);

            return res.status(201).json({
                sucesso: true,
                mensagem: "Cadastro realizado com sucesso!"
            });
        }
    );
});

// SERVIDOR
app.listen(PORT, "127.0.0.1", function () {

    console.log("=================================");
    console.log("🚀 SERVIDOR RODANDO");
    console.log("=================================");
    console.log("http://127.0.0.1:3000");
    console.log("=================================");

});