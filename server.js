const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do Supabase a partir das variáveis de ambiente
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração do CORS
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

// ROTA DE LOGIN
app.post("/login", async function (req, res) {
    const { usuario: email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ sucesso: false, mensagem: "Preencha usuário e senha." });
    }

    try {
        const { data, error } = await supabase
            .from("usuarios")
            .select("id, nome, email")
            .eq("email", email)
            .eq("senha", senha);

        if (error) {
            console.error("Erro no Supabase:", error);
            return res.status(500).json({ sucesso: false, mensagem: "Erro ao consultar o banco." });
        }

        if (data.length === 0) {
            return res.status(401).json({ sucesso: false, mensagem: "Usuário ou senha incorretos." });
        }

        const usuarioDados = data[0];
        return res.status(200).json({
            sucesso: true,
            mensagem: "Login realizado com sucesso!",
            id: usuarioDados.id,
            usuario: usuarioDados.nome,
            email: usuarioDados.email
        });
    } catch (err) {
        console.error("Erro inesperado:", err);
        return res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor." });
    }
});

// ROTA DE CADASTRO
app.post("/cadastro", async function (req, res) {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ sucesso: false, mensagem: "Preencha nome, email e senha." });
    }

    try {
        const { data, error } = await supabase
            .from("usuarios")
            .insert([{ nome, email, senha }]);

        if (error) {
            console.error("Erro ao cadastrar no Supabase:", error);
            if (error.code === "23505") { // Código do PostgreSQL para e-mail duplicado
                return res.status(409).json({ sucesso: false, mensagem: "Este email já está cadastrado." });
            }
            return res.status(500).json({ sucesso: false, mensagem: "Erro ao salvar no banco." });
        }

        return res.status(201).json({ sucesso: true, mensagem: "Cadastro realizado com sucesso!" });
    } catch (err) {
        console.error("Erro inesperado:", err);
        return res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor." });
    }
});

app.listen(PORT, "0.0.0.0", function () {
    console.log("🚀 SERVIDOR COM SUPABASE RODANDO NA PORTA " + PORT);
});