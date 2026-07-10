# Axon Labs — Guía de configuración (Firebase + despliegue)

Este sitio es HTML/CSS/JS puro (sin build step). El panel privado (`/dashboard`)
usa Firebase Authentication (correo/contraseña) y Firestore para guardar los
proyectos del portafolio, que las páginas públicas leen en tiempo real.

## 1. Habilitar Authentication

1. Firebase Console → tu proyecto `axonlabs-5524d` → **Authentication** → **Sign-in method**.
2. Activa **Correo electrónico/contraseña**.
3. En la pestaña **Users**, crea manualmente la cuenta (o cuentas) del/los dueño(s),
   por ejemplo `team@axonlabs.site`, con una contraseña segura.
4. Esos correos deben coincidir exactamente con la lista `ADMIN_EMAILS` en
   `js/firebase-config.js`. Agrega o quita correos ahí si cambian los dueños.

## 2. Crear la base de datos Firestore

1. Firebase Console → **Firestore Database** → **Crear base de datos** (modo producción, la región que prefieras).
2. No es necesario crear la colección `projects` a mano: el panel la crea
   automáticamente al guardar el primer proyecto.

## 3. Reglas de seguridad (IMPORTANTE)

El chequeo de `ADMIN_EMAILS` en `firebase-config.js` es solo una comodidad de
interfaz — **no reemplaza las reglas de Firestore**. Sin reglas, cualquiera con
la configuración pública de Firebase podría escribir en la colección. Ve a
**Firestore Database → Reglas** y pega algo como esto (ajusta los correos):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} {
      allow read: if true;
      allow write: if request.auth != null &&
        request.auth.token.email in [
          'team@axonlabs.site',
          'info@axonlabs.site'
        ];
    }
  }
}
```

Mantén esta lista igual a `ADMIN_EMAILS` en el código. Para más de 1-2 dueños,
considera migrar a **custom claims** (rol `admin` asignado vía Cloud Functions)
en lugar de listar correos directamente en las reglas.

## 4. Cómo funciona el contenido dinámico

- `js/portfolio-public.js`: lee la colección `projects` (ordenada por el campo
  `order`) y la pinta en Inicio (3 proyectos destacados) y en Portafolio (todos).
  Si la colección está vacía o Firestore no responde, se muestran proyectos
  **demostrativos** codificados en el mismo archivo, para que la sección nunca
  se vea vacía.
- `dashboard/panel.js`: CRUD completo (crear, editar, eliminar) sobre la misma
  colección, protegido por `onAuthStateChanged` + verificación de `ADMIN_EMAILS`.

## 5. Estructura de un proyecto (documento en `projects`)

| Campo         | Tipo     | Notas                                          |
|---------------|----------|-------------------------------------------------|
| title         | string   | Nombre del proyecto                              |
| description   | string   | Descripción corta (1-2 frases)                   |
| category      | string   | Ej. "Aplicación web", "E-commerce"                |
| tags          | string[] | Se generan separando por comas en el formulario  |
| imageUrl      | string   | URL pública de una imagen (opcional)             |
| link          | string   | URL del proyecto en vivo (opcional)              |
| order         | number   | Orden de aparición (menor = primero)             |
| demo          | boolean  | true = se etiqueta "Proyecto demostrativo"       |
| featured      | boolean  | Reservado para futura curaduría en Inicio        |

## 6. Despliegue del dominio axonlabs.site

Este es un sitio estático: puedes desplegarlo en **Firebase Hosting** (recomendado,
ya tienes el proyecto creado), Vercel o Netlify. Con Firebase Hosting:

```
npm install -g firebase-tools
firebase login
firebase init hosting   # selecciona axonlabs-5524d, carpeta pública = esta carpeta
firebase deploy
```

Luego, en el proveedor de dominio de `axonlabs.site`, apunta el dominio a
Firebase Hosting siguiendo el asistente de **Hosting → Añadir dominio personalizado**.

## 7. Acceso al panel

El panel **no está enlazado desde la navegación pública** a propósito. Se
accede directamente en `https://axonlabs.site/dashboard/login.html`.
