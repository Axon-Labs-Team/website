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

function toast(msg, ok){
  if(!els.toast) return;
  els.toast.textContent = msg;
  els.toast.className = "toast show " + (ok ? "ok" : "err");
  setTimeout(function(){ els.toast.className = "toast"; }, 3200);
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
    var snap = await getDocs(q);
    var rows = [];
    snap.forEach(function(d){ rows.push({ id: d.id, ...d.data() }); });
    render(rows);
  } catch(err){
    console.error(err);
    els.list.innerHTML = "<p class=\"muted\">No se pudieron cargar los proyectos. Revisa la configuración de Firestore.</p>";
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
        deleteDoc(doc(db, "projects", id)).then(function(){
          toast("Proyecto eliminado.", true);
          loadProjects();
        }).catch(function(){ toast("No se pudo eliminar.", false); });
      }
    });
  });
}

function escapeHtml(str){
  return String(str || "").replace(/[&<>"']/g, function(c){
    return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
  });
}

/* ---------- Formulario ---------- */
function fillForm(p){
  editingId = p.id;
  els.formTitle.textContent = "Editar proyecto";
  els.form.title.value = p.title || "";
  els.form.description.value = p.description || "";
  els.form.category.value = p.category || "";
  els.form.tags.value = (p.tags || []).join(", ");
  els.form.imageUrl.value = p.imageUrl || "";
  els.form.link.value = p.link || "";
  els.form.order.value = p.order ?? 0;
  els.form.demo.checked = !!p.demo;
  els.form.featured.checked = !!p.featured;
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

    var data = {
      title: els.form.title.value.trim(),
      description: els.form.description.value.trim(),
      category: els.form.category.value.trim(),
      tags: els.form.tags.value.split(",").map(function(t){ return t.trim(); }).filter(Boolean),
      imageUrl: els.form.imageUrl.value.trim(),
      link: els.form.link.value.trim(),
      order: parseInt(els.form.order.value, 10) || 0,
      demo: els.form.demo.checked,
      featured: els.form.featured.checked,
      updatedAt: serverTimestamp()
    };

    try{
      if(editingId){
        await updateDoc(doc(db, "projects", editingId), data);
        toast("Proyecto actualizado.", true);
      } else {
        data.createdAt = serverTimestamp();
        await addDoc(collection(db, "projects"), data);
        toast("Proyecto creado.", true);
      }
      resetForm();
      loadProjects();
    } catch(err){
      console.error(err);
      toast("No se pudo guardar el proyecto.", false);
    } finally {
      els.saveBtn.disabled = false;
      els.saveBtn.textContent = "Guardar proyecto";
    }
  });
}
