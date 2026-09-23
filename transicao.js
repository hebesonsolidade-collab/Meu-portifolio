/* ==========================================================================
   TRANSIÇÃO SOBRENATURAL ENTRE PÁGINAS — "portal dimensional"
   --------------------------------------------------------------------------
   Ao clicar em um link interno (.html) do portfólio:
     1. a página atual permanece visível;
     2. a barreira de energia nasce no canto esquerdo da tela;
     3. a nova página é revelada da ESQUERDA para a DIREITA;
     4. a página antiga é consumida/escondida pela passagem;
     5. ao final, a navegação real acontece.

   A camada de estilos vive no minecraft.css (regras iniciadas por #portal-).
   Nenhuma classe/lógica existente do projeto foi alterada.
   ========================================================================== */
(function () {
    "use strict";

    var REDUZIDO = window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* durações em ms — precisam combinar com --portal-tempo do CSS */
    var DURACAO = REDUZIDO ? 280 : 1500;
    var CARGA_MAX = 2600;          /* tempo máximo esperando a página carregar */
    var FIM_SEG = DURACAO + 220;   /* conclui a navegação logo após a varredura */
    var ABORT_APOS = DURACAO + 3400; /* se a navegação falhar, solta a tela */

    var ativo = false;
    var concluido = false;

    var raiz = null;
    var caixa = null;

    var CORES_PARTICULA = [
        "rgba(140,205,255,0.95)",
        "rgba(170,150,255,0.90)",
        "rgba(122,200,240,0.90)",
        "rgba(196,190,210,0.85)",
        "rgba(90,120,255,0.85)"
    ];

    /* ------------------------------------------------------------------
       CONSTRUÇÃO do overlay (uma única vez)
       ------------------------------------------------------------------ */
    function construir() {
        if (raiz) return;

        raiz = document.createElement("div");
        raiz.id = "portal-overlay";
        raiz.setAttribute("aria-hidden", "true");

        var mist = document.createElement("div");
        mist.id = "portal-mist";

        var sombra = document.createElement("div");
        sombra.id = "portal-shadow";

        caixa = document.createElement("div");
        caixa.id = "portal-in";

        var portal = document.createElement("div");
        portal.id = "portal-edge";

        var nucleo = document.createElement("span");
        nucleo.id = "portal-nucleo";
        portal.appendChild(nucleo);

        var bruma = document.createElement("span");
        bruma.id = "portal-bruma";
        portal.appendChild(bruma);

        /* partículas sobrenaturais dentro da barreira */
        var total = REDUZIDO ? 0 : 12;
        for (var i = 0; i < total; i++) {
            var p = document.createElement("span");
            p.className = "portal-p";
            var tamanho = 2 + Math.random() * 4;
            p.style.width = tamanho + "px";
            p.style.height = tamanho + "px";
            p.style.left = (8 + Math.random() * 84) + "%";
            p.style.top = (8 + Math.random() * 84) + "%";
            p.style.background =
                "radial-gradient(circle, " +
                CORES_PARTICULA[i % CORES_PARTICULA.length] +
                " 0%, rgba(10,8,20,0) 70%)";
            p.style.animationDuration = (1.8 + Math.random() * 2.4) + "s";
            p.style.animationDelay = (-Math.random() * 3) + "s";
            p.style.setProperty("--op", (0.35 + Math.random() * 0.6).toFixed(2));
            portal.appendChild(p);
        }

        raiz.appendChild(mist);
        raiz.appendChild(sombra);
        raiz.appendChild(caixa);
        raiz.appendChild(portal);

        document.body.appendChild(raiz);
    }

    /* ------------------------------------------------------------------
       Indica se o link é uma página interna que deve sofrer transição
       ------------------------------------------------------------------ */
    function extrairAlvo(ancora) {
        var href = (ancora.getAttribute("href") || "").trim();
        if (!href) return null;

        var alvoJanela = (ancora.getAttribute("target") || "").toLowerCase();
        if (alvoJanela && alvoJanela !== "_self") return null;

        var h = href.toLowerCase();
        if (
            h.charAt(0) === "#" ||
            /^javascript:/i.test(h) ||
            /^mailto:/i.test(h) ||
            /^tel:/i.test(h)
        ) return null;

        var url;
        try {
            url = new URL(href, document.baseURI);
        } catch (erro) {
            return null;
        }

        var proto = url.protocol;
        if (proto !== "http:" && proto !== "https:" && proto !== "file:") return null;
        if (proto !== "file:" && url.hostname !== window.location.hostname) return null;

        /* só cria o portal para destinos de página (.html) */
        var nome = url.pathname.split("/").pop() || "";
        if (nome !== "" && !/\.html?$/i.test(nome)) return null;

        /* é a própria página? mantém o comportamento normal */
        var atual = new URL(window.location.href);
        atual.hash = "";
        url.hash = "";
        if (url.href === atual.href) return null;

        return url;
    }

    /* ------------------------------------------------------------------
       INTERCEPTAÇÃO dos cliques
       ------------------------------------------------------------------ */
    document.addEventListener("click", function (ev) {
        if (!ev.isTrusted) return;
        if (ev.defaultPrevented) return;
        if (ev.button !== 0) return;
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;

        var no = ev.target;
        var ancora = null;
        while (no && no.nodeType === 1) {
            if (no.tagName === "A") {
                ancora = no;
                break;
            }
            no = no.parentNode;
        }
        if (!ancora) return;
        if (ancora.hasAttribute("download")) return;

        var url = extrairAlvo(ancora);
        if (!url) return;

        if (ativo) {
            /* transição em andamento: engole o clique para não quebrar nada */
            ev.preventDefault();
            ev.stopPropagation();
            return;
        }

        ev.preventDefault();
        ev.stopPropagation();
        iniciar(url);
    }, false);

    /* ------------------------------------------------------------------
       FLUXO da transição
       ------------------------------------------------------------------ */
    function iniciar(url) {
        ativo = true;
        concluido = false;

        construir();
        document.documentElement.classList.add("portal-busy");
        raiz.classList.add("active");

        /* remove um possível iframe de uma tentativa anterior */
        while (caixa.firstChild) caixa.removeChild(caixa.firstChild);

        var ifr = document.createElement("iframe");
        ifr.setAttribute("aria-hidden", "true");
        ifr.setAttribute("tabindex", "-1");
        ifr.title = "Prévia da próxima página";
        caixa.appendChild(ifr);

        var tCarga = null;
        var varrido = false;

        function varredura() {
            if (varrido) return;
            varrido = true;
            if (tCarga) clearTimeout(tCarga);

            raiz.classList.remove("charging");
            void raiz.offsetWidth; /* força reflow para a transição iniciar */
            raiz.classList.add("sweep");

            /* navegação real ao fim da animação */
            setTimeout(function () {
                if (concluido) return;
                concluido = true;
                window.location.assign(url.href);
            }, FIM_SEG);

            /* liberação de segurança caso a navegação não aconteça */
            setTimeout(function () {
                if (concluido) return;
                liberar();
            }, ABORT_APOS);
        }

        function pronto() {
            varredura();
        }

        ifr.addEventListener("load", pronto);
        ifr.addEventListener("error", pronto);

        /* se a página demorar demais, varre mesmo assim (sem travar) */
        tCarga = setTimeout(function () {
            raiz.classList.add("garantia");
            varredura();
        }, CARGA_MAX);

        ifr.src = url.href;
    }

    /* ------------------------------------------------------------------
       LIBERA a interface caso a navegação não ocorra
       ------------------------------------------------------------------ */
    function liberar() {
        ativo = false;
        concluido = false;
        document.documentElement.classList.remove("portal-busy");
        if (raiz) {
            raiz.classList.remove("active", "sweep", "charging", "garantia");
        }
    }
})();