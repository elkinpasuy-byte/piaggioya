# 🛵 PiaggioYa - Plataforma de Logística de Carga

Plataforma de logística de carga liviana tipo Uber, diseñada para conectar clientes con conductores de vehículos Piaggio (Chana y similares) en Pasto y sus alrededores.

---

## 📋 **Descripción**

PiaggioYa permite a los clientes solicitar envíos de carga, y a los conductores aceptar y completar viajes. Todo en tiempo real con mapas, rutas y calificaciones.


---

## ✅ **RESUMEN**

| Acción | Archivo |
|--------|---------|
| Crear documentación | `README.md` |

---

**¿Creas el archivo `README.md` con este contenido o necesitas ajustar algo?** 🚚
---

## 🚀 **Tecnologías**

| Tecnología | Uso |
|------------|-----|
| **React 18** | Frontend |
| **Vite** | Build tool |
| **Firebase** | Auth, Firestore, Storage |
| **Leaflet** | Mapas y rutas |
| **OSRM** | Cálculo de rutas reales |

---

## 🎯 **Funcionalidades**

### Cliente
- Solicitar envío (dirección recogida, dirección entrega, tipo de carga, peso)
- Ver historial de envíos
- Calificar al conductor (estrellas + comentario)
- Seguir envío en tiempo real

### Conductor
- Ver envíos disponibles
- Aceptar envío
- Ver ruta a recogida y a entrega
- Completar envío
- Ver historial de envíos completados

### Administrador (en desarrollo)
- Aprobar conductores
- Ver estadísticas de la plataforma

---
## Estructura del proyecto
src/
├── components/       # Componentes reutilizables
│   ├── map/          # Mapa, marcadores, rutas
│   ├── modals/       # Modales (confirmación, calificación)
│   └── PiaggioPanel/ # Panel lateral
├── contexts/         # Contextos (AuthContext)
├── hooks/            # Hooks personalizados
├── pages/            # Páginas de la aplicación
├── services/         # Servicios (Firebase, geocodificación)
└── utils/            # Utilidades

## 📦 **Instalación**

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/piaggioya.git

# Entrar al directorio
cd piaggioya

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# (Completar con tus claves de Firebase)
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
VITE_FIREBASE_APP_ID=tu_app_id

# Ejecutar en desarrollo
npm run dev

## Despliegue
## Vercel (recomendado)
npm run build
vercel --prod

## Enlaces
Repositorio GitHub

App en producción

## Problemas conocidos
Logout en celular: Puede mostrar un error 404 por caché del navegador. Limpiar caché o usar modo incógnito soluciona.

Geocodificación: Depende del servicio gratuito OpenStreetMap, puede ser lento o fallar.