/* Funcionalidades pequenas e exclusivas da página de currículo. */
(function () {
    "use strict";

    var ano = new Date().getFullYear();

    ["ano-atual", "ano-rodape", "ano-site"].forEach(function (id) {
        var elemento = document.getElementById(id);
        if (elemento) elemento.textContent = ano;
    });

    var botaoImprimir = document.getElementById("imprimir-curriculo");

    if (botaoImprimir) {
        botaoImprimir.addEventListener("click", function () {
            window.print();
        });
    }
})();
