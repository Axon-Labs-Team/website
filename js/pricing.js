/* ============================================================
   AXON LABS — pricing.js
   Conversión COP → USD (tasa referencial) + enlaces de WhatsApp
   personalizados por paquete.
   ============================================================ */
(function(){
  "use strict";
  var PHONE = "593986473716";

  /* Tasa referencial. Actualízala aquí cuando quieras reflejar
     un valor más reciente — todo el resto de la página se
     recalcula solo, no hay que tocar el HTML. */
  var USD_RATE = 3250;

  function formatUSD(n){
    return "$" + Math.round(n).toLocaleString("en-US");
  }

  document.querySelectorAll("[data-cop]").forEach(function(el){
    var cop = parseFloat(el.getAttribute("data-cop"));
    if(!cop) return;
    var usd = cop / USD_RATE;
    var prefix = el.getAttribute("data-prefix") || "≈";
    el.textContent = prefix + " " + formatUSD(usd) + " USD";
  });

  document.querySelectorAll("[data-wa-msg]").forEach(function(el){
    var text = el.getAttribute("data-wa-msg");
    var url = "https://wa.me/" + PHONE + "?text=" + encodeURIComponent(text);
    el.setAttribute("href", url);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });
})();
