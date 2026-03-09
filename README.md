
# CREUP Web

Proyecto de la nueva web de CREUP.

---

## Descripción

Proyecto basado en [Nuxt 4](https://nuxt.com/) con SSR, panel de administración y base de datos PostgreSQL gestionada con Drizzle ORM. Permite gestionar el contenido de la página de inicio (carrusel, noticias, enlaces, etiquetas) y sincroniza la agenda pública con Google Calendar. La interfaz utiliza [Nuxt UI](https://ui.nuxt.com/) y Tailwind CSS.

---

## Características principales

- **Base de datos**: PostgreSQL + Drizzle ORM
- **Panel de administración**: Modificación de carrusel, noticias, enlaces y etiquetas
- **Integración Google Calendar**: Sincronización de eventos
- **Correo en desarrollo**: Mailpit para capturar y revisar emails locales
- **Internacionalización**: Español (por defecto) y soporte para inglés
- **Accesibilidad y SEO**: Cumple buenas prácticas

---

## Desarrollo local

1. Instala dependencias:
	```sh
	pnpm install
	```
2. Copia y configura las variables de entorno necesarias (`.env`)
   En local, define `SITE_URL=http://localhost:3000` para que los enlaces absolutos de los correos apunten a la instancia correcta.
   Define también `ADMIN_EMAILS=correo1@dominio.es,correo2@dominio.es` para los accesos base al panel.
   Si quieres limitar todos los accesos admin a un dominio concreto, añade `ADMIN_EMAIL_DOMAIN=dominio.es`.
3. Levanta los servicios auxiliares:
	```sh
	docker compose up -d postgres adminer mailpit
	```
4. Ejecuta el entorno de desarrollo:
	```sh
	pnpm dev
	```
5. Para aplicar cambios en la base de datos:
	```sh
	pnpm db:generate
	pnpm db:migrate
	pnpm db:seed
	```

Mailpit queda disponible en `http://localhost:8025` y expone el servidor SMTP en `localhost:1025` para pruebas de envío de correo.

---

## Estructura del proyecto

- `app/` — Componentes Vue, layouts, páginas y composables
- `server/api/` — Endpoints públicos y de administración (Nitro)
- `server/db/` — Esquema Drizzle y cliente de base de datos
- `i18n/locales/` — Archivos de traducción
- `drizzle/` — Migraciones y seeds

---

**Rama de pruebas:** `testing`
