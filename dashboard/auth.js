/* ============================================================
   AXON LABS — auth.js (login del dashboard)
   ============================================================ */
import { auth, ADMIN_EMAILS } from "../js/firebase-config.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const form = document.getElementById("login-form");
const errorBox = document.getElementById("login-error");
const submitBtn = document.getElementById("login-submit");

function showError(msg){
  if(!errorBox) return;
  errorBox.textContent = msg;
  errorBox.style.display = "block";
}
function hideError(){
  if(!errorBox) return;
  errorBox.style.display = "none";
}

// Si ya hay sesión activa y autorizada, saltar directo al panel.
onAuthStateChanged(auth, function(user){
  if(user && ADMIN_EMAILS.includes(user.email)){
    window.location.href = "panel.html";
  }
});

if(form){
  form.addEventListener("submit", function(e){
    e.preventDefault();
    hideError();
    var email = document.getElementById("login-email").value.trim();
    var pass = document.getElementById("login-pass").value;

    submitBtn.disabled = true;
    submitBtn.textContent = "Verificando...";

    signInWithEmailAndPassword(auth, email, pass)
      .then(function(cred){
        if(!ADMIN_EMAILS.includes(cred.user.email)){
          signOut(auth);
          showError("Esta cuenta no tiene acceso al panel de administración.");
          return;
        }
        window.location.href = "panel.html";
      })
      .catch(function(err){
        console.warn(err);
        showError("Correo o contraseña incorrectos.");
      })
      .finally(function(){
        submitBtn.disabled = false;
        submitBtn.textContent = "Iniciar sesión";
      });
  });
}
