/* ============================================================
   AXON LABS — Firebase config (módulo compartido)
   Usado por: portfolio-public.js, auth.js, dashboard.js
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAk0ULd64mfdYAcN_Ag9AeQu2nmGVIDmkA",
  authDomain: "axonlabs-5524d.firebaseapp.com",
  projectId: "axonlabs-5524d",
  storageBucket: "axonlabs-5524d.firebasestorage.app",
  messagingSenderId: "267522384553",
  appId: "1:267522384553:web:f08ed895764a75278dbfb8",
  measurementId: "G-4QDPK1FCDT"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics solo si el navegador lo soporta (evita errores en Safari/privado)
isSupported().then((ok) => { if(ok) getAnalytics(app); }).catch(()=>{});

/* ------------------------------------------------------------
   Lista de correos autorizados para acceder al panel /dashboard.
   Esto es una validación de conveniencia en el cliente:
   la seguridad real la debe imponer Firestore Security Rules
   (ver README-FIREBASE.md) comparando request.auth.token.email
   contra la colección "admins".
   ------------------------------------------------------------ */
export const ADMIN_EMAILS = [
  "team@axonlabs.site",
  "info@axonlabs.site"
];
