/* ============================================================
   AXON LABS — contact.js
   Genera enlaces de WhatsApp con mensajes prellenados por tema.
   ============================================================ */
(function(){
  "use strict";
  var PHONE = "593964073557";

  var presets = {
    consultoria: "Hola Axon Labs, me gustaría agendar una consultoría inicial para un proyecto de software.",
    cotizacion: "Hola Axon Labs, quisiera solicitar una cotización para un proyecto. Les cuento el detalle:",
    soporte: "Hola Axon Labs, necesito soporte sobre un proyecto ya entregado.",
    alianza: "Hola Axon Labs, me gustaría conversar sobre una posible alianza o colaboración."
  };

  document.querySelectorAll("[data-wa]").forEach(function(btn){
    var key = btn.getAttribute("data-wa");
    var text = presets[key] || "Hola Axon Labs, me gustaría más información.";
    var url = "https://wa.me/" + PHONE + "?text=" + encodeURIComponent(text);
    btn.setAttribute("href", url);
    btn.setAttribute("target", "_blank");
    btn.setAttribute("rel", "noopener");
  });
})();
