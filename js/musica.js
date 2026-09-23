/* ==========================================================================
   SISTEMA DE MÚSICA DO PORTFÓLIO — "pasta de arquivo investigativo"
   --------------------------------------------------------------------------
   Cria um player fixo (canto superior direito) com a estética do restante
   do site: pasta de couro envelhecido + CD de prata saindo dela.

   • CD gira somente durante a reprodução real (eventos play/pause/ended);
   • preserva a posição e o estado entre páginas via sessionStorage;
   • tenta retomar a reprodução após navegação sem quebrar (se o navegador
     bloquear o autoplay, o player simplesmente fica em pausa);
   • não altera navegação, transição do portal, login ou cadastro.
   ========================================================================== */
(function () {
    "use strict";

    /* ---- guarda extra: jamais ativa no login / cadastro ---------------- */
    var titulo = (document.title || "").toLowerCase();
    if (titulo === "login" || titulo === "cadastro") return;

    if (document.getElementById("mf-player")) return;

    /* iframe de pré-visualização usado pelo portal de transição: exibe o
       player, mas não tenta autoplay nem grava estado (evita áudio duplo) */
    var emPreview = window.self !== window.top;

    /* ---- constantes ------------------------------------------------------ */
    var FONTE = "musica/the-chain.mp3";

    var CH_TEMPO = "mf-portfolio-tempo";
    var CH_TOQUE = "mf-portfolio-tocando";

    /* ---- elemento de áudio ---------------------------------------------- */
    var audio = document.createElement("audio");
    audio.id = "mf-audio";
    audio.preload = "auto";

    var fonte = document.createElement("source");
    fonte.src = FONTE;
    fonte.type = "audio/mpeg";
    audio.appendChild(fonte);

    /* ---- construção da interface (uma vez por página) ------------------- */
    function span() {
        return document.createElement("span");
    }

    var pasta = span();
    pasta.id = "mf-pasta";
    pasta.setAttribute("aria-hidden", "true");

    var aba = span();
    aba.id = "mf-aba";
    aba.textContent = "ARQUIVO";

    var tituloTrilha = span();
    tituloTrilha.id = "mf-titulo";
    tituloTrilha.textContent = "The Chain";

    var cd = span();
    cd.id = "mf-cd";

    var cdRot = span();
    cdRot.id = "mf-cd-rot";

    var furo = span();
    furo.id = "mf-furo";
    cdRot.appendChild(furo);
    cd.appendChild(cdRot);

    pasta.appendChild(aba);
    pasta.appendChild(tituloTrilha);
    pasta.appendChild(cd);

    var botao = document.createElement("button");
    botao.id = "mf-botao";
    botao.type = "button";
    botao.setAttribute("aria-label", "Reproduzir trilha The Chain");
    botao.setAttribute("aria-pressed", "false");
    botao.appendChild(pasta);

    var status = span();
    status.id = "mf-status";
    status.setAttribute("aria-hidden", "true");
    status.textContent = "Parado";

    var player = span();
    player.id = "mf-player";
    player.appendChild(botao);
    player.appendChild(status);

    document.body.appendChild(audio);
    document.body.appendChild(player);

    /* ---- persistência (sessionStorage sobrevive à navegação) ------------ */
    function salvarTempo() {
        if (emPreview) return;
        try {
            sessionStorage.setItem(CH_TEMPO, String(audio.currentTime));
        } catch (erro) { /* storage indisponível — segue sem persistir */ }
    }

    function salvarToque(tocando) {
        if (emPreview) return;
        try {
            sessionStorage.setItem(CH_TOQUE, tocando ? "1" : "0");
        } catch (erro) { /* ignora */ }
    }

    function lerTempo() {
        try {
            var t = parseFloat(sessionStorage.getItem(CH_TEMPO));
            return isFinite(t) && t > 0 ? t : 0;
        } catch (erro) {
            return 0;
        }
    }

    function lerToque() {
        try {
            return sessionStorage.getItem(CH_TOQUE) === "1";
        } catch (erro) {
            return false;
        }
    }

    /* ---- sincronização do visual com o estado REAL do áudio ------------- */
    function aoReproduzir() {
        player.classList.add("rodando");
        botao.setAttribute("aria-pressed", "true");
        botao.setAttribute("aria-label", "Pausar trilha The Chain");
        status.textContent = "Tocando";
        salvarToque(true);
    }

    function aoPausar() {
        player.classList.remove("rodando");
        botao.setAttribute("aria-pressed", "false");
        botao.setAttribute("aria-label", "Reproduzir trilha The Chain");
        status.textContent = audio.ended ? "Parado" : "Em pausa";
        salvarToque(false);
    }

    audio.addEventListener("play", aoReproduzir);
    audio.addEventListener("playing", aoReproduzir);
    audio.addEventListener("pause", aoPausar);

    audio.addEventListener("ended", function () {
        aoPausar();
        try { audio.currentTime = 0; } catch (erro) { }
        salvarTempo();
    });

    /* grava a posição durante a reprodução (no máximo 1x por segundo) */
    var ultimoSegundo = -1;
    audio.addEventListener("timeupdate", function () {
        var segundo = Math.floor(audio.currentTime);
        if (segundo !== ultimoSegundo) {
            ultimoSegundo = segundo;
            salvarTempo();
        }
    });

    /* salva a posição ao sair da página */
    if (window.addEventListener) {
        window.addEventListener("pagehide", salvarTempo);
        window.addEventListener("beforeunload", salvarTempo);
    }

    /* ---- botão: tocar / pausar / continuar / reiniciar ------------------- */
    function alternar() {
        if (!audio.paused && !audio.ended) {
            audio.pause();
            return;
        }
        if (audio.ended) {
            try { audio.currentTime = 0; } catch (erro) { }
        }
        var promessa = audio.play();
        if (promessa && promessa.catch) {
            promessa.catch(function () {
                /* autoplay bloqueado: não mostra erro, apenas fica pausado */
                aoPausar();
            });
        }
    }

    botao.addEventListener("click", function (ev) {
        ev.preventDefault();
        alternar();
    });

    botao.addEventListener("keydown", function (ev) {
        if (ev.key === " " || ev.key === "Enter") {
            ev.preventDefault();
            alternar();
        }
    });

    /* ---- restaura o estado salvo ao entrar na página --------------------- */
    var tempoSalvo = lerTempo();
    var deveRetomar = !emPreview && lerToque();

    audio.addEventListener("loadedmetadata", function () {
        if (tempoSalvo > 0) {
            try {
                audio.currentTime = tempoSalvo;
            } catch (erro) { /* arquivo não permite busca */ }
        }

        if (deveRetomar) {
            var promessa = audio.play();
            if (promessa && promessa.catch) {
                promessa.catch(function () {
                    /* navegador pediu interação — fica pausado para o usuário */
                    deveRetomar = false;
                    aoPausar();
                });
            }
        } else {
            status.textContent = tempoSalvo > 0 ? "Em pausa" : "Parado";
        }
    });

    audio.addEventListener("error", function () {
        player.classList.remove("rodando");
        botao.setAttribute("aria-pressed", "false");
        status.textContent = "Trilha indisponível";
    });
})();