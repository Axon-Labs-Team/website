/* ============================================================
   AXON LABS — panel.js
   Guarda de sesión + CRUD de proyectos (colección "projects")
   ============================================================ */
import { auth, db, ADMIN_EMAILS } from "../js/firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  getDocs, orderBy, query, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const els = {
  gate: document.getElementById("panel-gate"),
  app: document.getElementById("panel-app"),
  userEmail: document.getElementById("panel-user-email"),
  logout: document.getElementById("panel-logout"),
  list: document.getElementById("projects-list"),
  empty: document.getElementById("projects-empty"),
  form: document.getElementById("project-form"),
  formTitle: document.getElementById("form-title"),
  cancelEdit: document.getElementById("cancel-edit"),
  saveBtn: document.getElementById("save-project"),
  toast: document.getElementById("panel-toast"),
};

let editingId = null;
let toastTimer = null;

/* Evita que una operación se quede "colgada" para siempre si Firestore
   no responde (reglas mal configuradas, red bloqueada, base de datos
   no creada, etc.). Sin esto, un problema de conexión deja el botón
   en "Guardando..." indefinidamente sin ningún aviso. */
function withTimeout(promise, ms, timeoutMessage){
  var timeoutId;
  var timeout = new Promise(function(_, reject){
    timeoutId = setTimeout(function(){ reject(new Error(timeoutMessage)); }, ms);
  });
  return Promise.race([promise, timeout]).finally(function(){ clearTimeout(timeoutId); });
}

function toast(msg, ok){
  if(!els.toast) return;
  els.toast.textContent = msg;
  els.toast.className = "toast show " + (ok ? "ok" : "err");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ els.toast.className = "toast"; }, ok ? 3200 : 9000);
}

/* Traduce errores comunes de Firebase a un mensaje accionable */
function describeError(err){
  var code = err && err.code;
  var msg = (err && err.message) || "";
  if(code === "permission-denied"){
    return "Firestore rechazó el acceso (permission-denied). Revisa que las reglas de seguridad estén publicadas en Firebase Console y que tu correo esté en la lista de administradores.";
  }
  if(code === "unavailable"){
    return "No se pudo contactar a Firestore (sin conexión o servidor no disponible). Intenta de nuevo en unos segundos.";
  }
  if(msg){
    return msg;
  }
  return "No se pudo completar la operación. Revisa la consola del navegador (F12) para más detalle.";
}

/* ---------- Guarda de acceso ---------- */
onAuthStateChanged(auth, function(user){
  if(!user || !ADMIN_EMAILS.includes(user.email)){
    window.location.href = "login.html";
    return;
  }
  if(els.gate) els.gate.style.display = "none";
  if(els.app) els.app.style.display = "block";
  if(els.userEmail) els.userEmail.textContent = user.email;
  loadProjects();
});

if(els.logout){
  els.logout.addEventListener("click", function(){
    signOut(auth).then(function(){ window.location.href = "login.html"; });
  });
}

/* ---------- Listado ---------- */
async function loadProjects(){
  els.list.innerHTML = "<p class=\"muted\">Cargando proyectos...</p>";
  try{
    var q = query(collection(db, "projects"), orderBy("order", "asc"));
    var snap = await withTimeout(
      getDocs(q), 12000,
      "Sin respuesta de Firestore tras 12s al cargar los proyectos."
    );
    var rows = [];
    snap.forEach(function(d){ rows.push({ id: d.id, ...d.data() }); });
    render(rows);
  } catch(err){
    console.error("Error al cargar proyectos:", err);
    els.list.innerHTML = "<p class=\"muted\">No se pudieron cargar los proyectos. " + describeError(err) + "</p>";
  }
}

function render(rows){
  if(!rows.length){
    els.list.innerHTML = "";
    els.empty.style.display = "block";
    return;
  }
  els.empty.style.display = "none";
  els.list.innerHTML = rows.map(function(p){
    return (
      "<div class=\"proj-row\" data-id=\"" + p.id + "\">" +
        "<div class=\"proj-row-main\">" +
          "<strong>" + escapeHtml(p.title) + "</strong>" +
          "<span class=\"muted\">" + escapeHtml(p.category || "") + " · orden " + (p.order ?? "—") + (p.demo ? " · demo" : " · real") + "</span>" +
        "</div>" +
        "<div class=\"proj-row-actions\">" +
          "<button class=\"btn btn-ghost btn-sm\" data-edit=\"" + p.id + "\">Editar</button>" +
          "<button class=\"btn btn-ghost btn-sm danger\" data-del=\"" + p.id + "\">Eliminar</button>" +
        "</div>" +
      "</div>"
    );
  }).join("");

  els.list.querySelectorAll("[data-edit]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var row = rows.find(function(r){ return r.id === btn.getAttribute("data-edit"); });
      if(row) fillForm(row);
    });
  });
  els.list.querySelectorAll("[data-del]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var id = btn.getAttribute("data-del");
      if(confirm("¿Eliminar este proyecto? Esta acción no se puede deshacer.")){
        withTimeout(deleteDoc(doc(db, "projects", id)), 12000, "Sin respuesta de Firestore al eliminar.")
          .then(function(){
            toast("Proyecto eliminado.", true);
            loadProjects();
          })
          .catch(function(err){
            console.error("Error al eliminar:", err);
            toast(describeError(err), false);
          });
      }
    });
  });
}

function escapeHtml(str){
  return String(str || "").replace(/[&<>"']/g, function(c){
    return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
  });
}

/* ---------- Formulario ----------
   Se referencian los campos por su id (no por form.<name>) porque
   nombres como "title" chocan con propiedades nativas de los
   elementos HTML (title = atributo tooltip), lo que antes rompía
   el guardado de forma silenciosa. */
const fields = {
  title: document.getElementById("p-title"),
  description: document.getElementById("p-description"),
  category: document.getElementById("p-category"),
  tags: document.getElementById("p-tags"),
  imageUrl: document.getElementById("p-image"),
  link: document.getElementById("p-link"),
  order: document.getElementById("p-order"),
  demo: document.getElementById("p-demo"),
  featured: document.getElementById("p-featured"),
};

function fillForm(p){
  editingId = p.id;
  els.formTitle.textContent = "Editar proyecto";
  fields.title.value = p.title || "";
  fields.description.value = p.description || "";
  fields.category.value = p.category || "";
  fields.tags.value = (p.tags || []).join(", ");
  fields.imageUrl.value = p.imageUrl || "";
  fields.link.value = p.link || "";
  fields.order.value = p.order ?? 0;
  fields.demo.checked = !!p.demo;
  fields.featured.checked = !!p.featured;
  els.cancelEdit.style.display = "inline-flex";
  els.form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetForm(){
  editingId = null;
  els.form.reset();
  els.formTitle.textContent = "Añadir proyecto";
  els.cancelEdit.style.display = "none";
}

if(els.cancelEdit){ els.cancelEdit.addEventListener("click", resetForm); }

if(els.form){
  els.form.addEventListener("submit", async function(e){
    e.preventDefault();
    els.saveBtn.disabled = true;
    els.saveBtn.textContent = "Guardando...";

    try{
      var data = {
        title: fields.title.value.trim(),
        description: fields.description.value.trim(),
        category: fields.category.value.trim(),
        tags: fields.tags.value.split(",").map(function(t){ return t.trim(); }).filter(Boolean),
        imageUrl: fields.imageUrl.value.trim(),
        link: fields.link.value.trim(),
        order: parseInt(fields.order.value, 10) || 0,
        demo: fields.demo.checked,
        featured: fields.featured.checked,
        updatedAt: serverTimestamp()
      };

      if(!data.title){
        throw new Error("El título es obligatorio.");
      }

      var timeoutMsg = "Sin respuesta de Firestore tras 12 segundos. Revisa: 1) que existe una base de datos creada en Firebase Console → Firestore Database, 2) que las reglas de seguridad estén publicadas, 3) tu conexión a internet, 4) que ningún bloqueador de anuncios/extensión esté frenando peticiones a *.googleapis.com.";

      if(editingId){
        await withTimeout(updateDoc(doc(db, "projects", editingId), data), 12000, timeoutMsg);
        toast("Proyecto actualizado.", true);
      } else {
        data.createdAt = serverTimestamp();
        await withTimeout(addDoc(collection(db, "projects"), data), 12000, timeoutMsg);
        toast("Proyecto creado.", true);
      }
      resetForm();
      loadProjects();
    } catch(err){
      console.error("Error al guardar el proyecto:", err);
      toast(describeError(err), false);
    } finally {
      els.saveBtn.disabled = false;
      els.saveBtn.textContent = "Guardar proyecto";
    }
  });
}
