const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do CORS para permitir o GitHub Pages e testes locais
const origensPermitidas = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://hebesonsolidade-collab.github.io"
];

app.use(cors({
    origin: function (origem, callback) {
        if (!origem || origensPermitidas.includes(origem)) {
            callback(null, true);
        } else {
            callback(new Error("Origem bloqueada pelo CORS."));
        }
    }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CONEXÃO COM O MYSQL DA AIVEN (Lendo as variáveis do Render)
const banco = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 22318,
    user: process.env.DB_USER || "avnadmin",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "ACESSOPORTI",
    ssl: {
        rejectUnauthorized: false
    }
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

            console.log("Usuários encontrados:", resultado.length);

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
app.listen(PORT, "0.0.0.0", function () {
    console.log("=================================");
    console.log("🚀 SERVIDOR RODANDO NA PORTA " + PORT);
    console.log("=================================");
});