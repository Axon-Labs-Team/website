/* ============================================================
   AXON LABS — portfolio-public.js
   Lee proyectos desde Firestore ("projects") y los renderiza.
   Si la colección está vacía o falla la conexión, usa proyectos
   demostrativos (claramente marcados) para no dejar la sección vacía.
   ============================================================ */
import { db } from "./firebase-config.js";
import { collection, getDocs, orderBy, query, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const DEMO_PROJECTS = [
  {
    title: "Panel de operaciones en tiempo real",
    description: "Dashboard interno para monitorear pedidos, inventario y métricas de venta en un solo lugar, con alertas automáticas.",
    category: "Aplicación web",
    tags: ["React", "Firebase", "Automatización"],
    demo: true
  },
  {
    title: "Plataforma de reservas para servicios",
    description: "Sistema de agendamiento con pagos integrados, recordatorios automáticos por WhatsApp y panel de administración.",
    category: "E-commerce / Booking",
    tags: ["Next.js", "Stripe", "API"],
    demo: true
  },
  {
    title: "Sitio corporativo de alto rendimiento",
    description: "Landing page institucional optimizada para conversión, velocidad de carga y posicionamiento en buscadores.",
    category: "Landing page",
    tags: ["SEO", "Performance", "CMS"],
    demo: true
  }
];

function escapeHtml(str){
  return String(str || "").replace(/[&<>"']/g, function(c){
    return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
  });
}

function cardHTML(p){
  var tags = (p.tags || []).map(function(t){ return "<span>" + escapeHtml(t) + "</span>"; }).join("");
  var badge = p.demo ? "<span class=\"project-badge\">Proyecto demostrativo</span>" : "<span class=\"project-badge\">Proyecto real</span>";
  var thumb = p.imageUrl
    ? "<img src=\"" + escapeHtml(p.imageUrl) + "\" alt=\"" + escapeHtml(p.title) + "\" loading=\"lazy\">"
    : "<img class=\"ph-mark\" src=\"assets/logo-mark-alpha.png\" alt=\"\" loading=\"lazy\">";
  var link = p.link
    ? "<a class=\"project-link\" href=\"" + escapeHtml(p.link) + "\" target=\"_blank\" rel=\"noopener\">Ver proyecto →</a>"
    : "";
  return (
    "<article class=\"project-card reveal\">" +
      "<div class=\"project-thumb\">" + badge + thumb + "</div>" +
      "<div class=\"project-body\">" +
        "<span class=\"eyebrow\">" + escapeHtml(p.category || "Proyecto") + "</span>" +
        "<h3>" + escapeHtml(p.title) + "</h3>" +
        "<p>" + escapeHtml(p.description) + "</p>" +
        "<div class=\"project-tags\">" + tags + "</div>" +
        link +
      "</div>" +
    "</article>"
  );
}

function render(container, projects){
  if(!container) return;
  container.innerHTML = projects.map(cardHTML).join("");
  // Re-observa los nuevos .reveal insertados dinámicamente
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold:.1 });
    container.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
  } else {
    container.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); });
  }
}

async function loadProjects(containerSelector, max){
  var container = document.querySelector(containerSelector);
  if(!container) return;
  try{
    var q = max
      ? query(collection(db, "projects"), orderBy("order", "asc"), limit(max))
      : query(collection(db, "projects"), orderBy("order", "asc"));
    var snap = await getDocs(q);
    var projects = [];
    snap.forEach(function(doc){ projects.push(doc.data()); });
    if(projects.length === 0){
      render(container, max ? DEMO_PROJECTS.slice(0, max) : DEMO_PROJECTS);
    } else {
      render(container, projects);
    }
  } catch(err){
    console.warn("No se pudo leer Firestore, mostrando proyectos demostrativos.", err);
    render(container, max ? DEMO_PROJECTS.slice(0, max) : DEMO_PROJECTS);
  }
}

document.querySelectorAll('[data-projects]').forEach(function(el){
  var max = el.getAttribute('data-projects-max');
  loadProjects('[data-projects="' + el.getAttribute('data-projects') + '"]', max ? parseInt(max,10) : null);
});
