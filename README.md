# RitmoVital Health Hub

Markdown

Actúa como un Desarrollador Frontend Full-Stack Senior y experto en UX/UI. Tu tarea es diseñar e implementar la interfaz gráfica completa para **RitmoVital**, un sistema web y móvil de monitoreo clínico de salud cardíaca en tiempo real, conectividad local con IA y gestión biométrica.

Basándote en las imágenes de diseño provistas (Inicio de sesión, Dashboard principal de monitoreo en tiempo real con historial y gráficas, Módulo de Reportes y Calculadora de Zonas de Entrenamiento, Mapeo y Diario de Síntomas, y Gestión de Perfil con cumplimiento normativo de la Ley 1581 de 2012 de Colombia), necesito que construyas una aplicación web robusta, fluida y altamente responsiva.

---

### 1. Contexto del Proyecto y Arquitectura Actual
Hemos construido previamente el núcleo backend y la lógica del sistema. La estructura de directorios en nuestro entorno de desarrollo local (Visual Studio Code) es la siguiente:

```text
RitmoVital/
│
├── backend/
│   ├── venv/                 # Entorno virtual de Python
│   ├── app.py                # Servidor principal en Flask (API REST)
│   ├── requirements.txt      # Dependencias (Flask, Flask-CORS, etc.)
│   └── .env                  # Variables de entorno y configuración del modelo local (Qwen3)
│
├── frontend/
│   ├── index.html            # Interfaz base web de chat e interacción
│   └── ...                   # Archivos estáticos y componentes visuales
│
└── README.md                 # Documentación del proyecto


2. Conexiones y Endpoints Técnicos

La interfaz debe conectarse con el servidor backend en Flask que corre localmente en http://127.0.0.1:5000/api/chat.

Método: POST

Cabeceras (Headers): Content-Type: application/json

Cuerpo de la Petición (Body JSON esperado por el backend):

JSON

{
  "imc": 26.5,
  "bpm": 135,
  "mensaje": "¿Puedo trotar hoy?"
}


Respuesta del Servidor (Ejemplo):

JSON

{
  "alerta_activa": true,
  "bpm_registrado": 135,
  "respuesta_asistente": "**Alerta médica activa:** Tu frecuencia cardíaca actual (135 BPM) está por encima del umbral seguro..."
}


La interfaz debe ser capaz de enviar estas variables biométricas (IMC y BPM en tiempo real, ya sea de forma manual o simulando un dispositivo) junto con las consultas del usuario, y procesar las alertas médicas automáticas cuando alerta_activa sea true.

3. Requisitos Funcionales y de Navegación

Autenticación (Inicio de Sesión):

Debe incluir una pantalla de acceso limpia, moderna y segura (como se ve en los diseños), que permita validar credenciales (Correo electrónico y Contraseña) antes de dar acceso al panel principal.

Incluir enlaces de recuperación de contraseña y avisos de seguridad/encriptación de datos de grado médico.

Navegación Fluida (Breadcrumbs y Historial):

La aplicación debe permitir una navegación web rica entre secciones: Inicio (Dashboard), Mediciones, Síntomas, Reportes y Configuración/Perfil.

Implementa miga de pan (Breadcrumbs) en la parte superior de las vistas internas para que el usuario sepa exactamente en qué ruta se encuentra.

Agrega botones de retorno ("Volver a la parte anterior") funcionales para mejorar la experiencia de usuario (UX).

Módulos Visuales Requeridos (basados en las capturas):

Dashboard de Inicio: Visualización del ritmo cardíaco en tiempo real con gráfica de onda, estado óptimo/alerta, lectura rápida y tendencias semanales, además de la bitácora de mediciones recientes (con indicadores de color para estados "Normal" o "Elevado").

Reportes y Calculadora de Zonas: Exportación de informes médicos por rango de fechas (PDF / Excel) y una calculadora visual de zonas de entrenamiento (Calentamiento, Quema de Grasa, Cardio, Pico) basada en rangos de BPM.

Mapeo y Diario de Síntomas: Formulario interactivo para registrar el pulso actual, contexto de actividad (Reposo, Ejercicio, Estrés), selección visual de síntomas (Mareo, Fatiga, Dolor de cabeza, Ninguno) y notas en bitácora.

Gestión de Perfil: Edición de datos biométricos, cuenta, tipo de sangre, contraseña y la casilla obligatoria de consentimiento informado para el tratamiento de datos personales sensibles conforme a la Ley 1581 de 2012 de Colombia.

Diseño Responsivo y Escalabilidad Móvil:

El diseño debe ser adaptable (responsive). Aunque esté pensado inicialmente como una aplicación web de escritorio con barra lateral de navegación, la estructura debe permitir y facilitar su futura migración o empaquetado directo en un entorno móvil (adaptándose perfectamente a pantallas táctiles y dispositivos celulares mediante un diseño mobile-first o vistas colapsables).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3c04bac6-4e1b-4560-b6e8-ba9cb0680b43).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
