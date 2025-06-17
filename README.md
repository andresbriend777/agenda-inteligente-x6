# 📋 Agenda Inteligente X6 - Sistema de Gestión de Tareas con IA

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/inovexacompany-8897s-projects/agenda-inteligente)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

## 🎯 Descripción General

**Agenda Inteligente X6** es una aplicación web moderna que combina la funcionalidad de un sistema Kanban tradicional con capacidades de inteligencia artificial para la gestión inteligente de tareas. El sistema permite a los usuarios crear, organizar y gestionar tareas a través de una interfaz conversacional natural, utilizando procesamiento de lenguaje natural (NLP) y un motor de inferencia basado en reglas.

## ✨ Características Principales

### 🤖 Asistente Inteligente con IA
- **Procesamiento de Lenguaje Natural**: Entiende comandos en español natural
- **Motor de Inferencia**: Sistema basado en reglas para interpretar intenciones
- **Análisis de Entidades**: Extracción automática de información relevante
- **Contexto Inteligente**: Mantiene el contexto del tablero activo

### 📊 Gestión de Tableros Kanban
- **Creación Inteligente**: "Crea un tablero llamado Proyecto Web"
- **Organización Visual**: Columnas personalizables (Por Hacer, Haciendo, Hecho)
- **Gestión Completa**: Crear, modificar, eliminar tableros y columnas

### ✅ Sistema de Tareas Avanzado
- **Tareas Inteligentes**: Creación mediante comandos naturales
- **Prioridades**: Alta, Media, Baja con indicadores visuales
- **Fechas de Vencimiento**: Gestión automática de fechas
- **Asignación de Miembros**: Gestión de equipos de trabajo
- **Movimiento entre Columnas**: "Mueve la tarea X a Hecho"

### 🎨 Interfaz Moderna
- **Diseño Responsivo**: Adaptable a diferentes dispositivos
- **Tema Oscuro/Claro**: Soporte para preferencias de usuario
- **Componentes UI**: Basado en Radix UI y Tailwind CSS
- **Experiencia Fluida**: Navegación intuitiva y feedback visual

## 🏗️ Arquitectura del Sistema

### Frontend (Next.js 15 + React 19)
```
app/
├── page.tsx              # Página principal con gestión de tableros
├── layout.tsx            # Layout principal de la aplicación
├── globals.css           # Estilos globales
└── api/                  # Endpoints de la API
    ├── chat/             # Procesamiento de mensajes IA
    ├── boards/           # Gestión de tableros
    └── columns/          # Gestión de columnas
```

### Backend (API Routes + MongoDB)
```
lib/
├── inference-engine.ts   # Motor de inferencia principal
├── natural-language-processor.ts  # Procesador NLP
├── db.ts                 # Conexión y utilidades de MongoDB
├── types.ts              # Definiciones de tipos TypeScript
├── nlp/                  # Módulos de procesamiento de lenguaje
│   ├── intent-analyzer.ts    # Análisis de intenciones
│   └── entity-extractor.ts   # Extracción de entidades
└── rules/                # Reglas del motor de inferencia
    ├── board-rules.ts    # Reglas para gestión de tableros
    ├── column-rules.ts   # Reglas para gestión de columnas
    └── task-rules.ts     # Reglas para gestión de tareas
```

### Componentes UI
```
components/
├── chat-interface.tsx    # Interfaz de chat con IA
├── board-list.tsx        # Lista de tableros
├── theme-provider.tsx    # Proveedor de temas
└── ui/                   # Componentes base (Radix UI)
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    └── scroll-area.tsx
```

## 🧠 Sistema de Inteligencia Artificial

### Motor de Inferencia
El sistema utiliza un motor de inferencia basado en reglas que:

1. **Analiza la Intención**: Identifica qué acción quiere realizar el usuario
2. **Extrae Entidades**: Obtiene información específica (nombres, fechas, prioridades)
3. **Aplica Reglas**: Ejecuta la acción correspondiente según la prioridad
4. **Proporciona Feedback**: Devuelve respuestas contextuales y útiles

### Reglas Implementadas

#### Tableros (Prioridad 10)
- **R1**: Crear tablero - "Crea un tablero llamado Marketing"
- **R2**: Eliminar tablero - "Elimina el tablero actual"
- **R3**: Modificar tablero - "Cambia el nombre del tablero a Proyecto Final"

#### Columnas (Prioridad 9)
- **R4**: Crear columna - "Crea una columna llamada En Revisión"
- **R5**: Eliminar columna - "Elimina la columna Pendiente"
- **R6**: Modificar columna - "Cambia el nombre de la columna"

#### Tareas (Prioridad 8)
- **R7**: Crear tarea - "Crea una tarea llamada Diseñar Logo"
- **R8**: Eliminar tarea - "Elimina la tarea Reunión de Equipo"
- **R9**: Modificar tarea - "Cambia la prioridad de la tarea a Alta"
- **R10**: Mover tarea - "Mueve la tarea a la columna Hecho"

### Procesamiento de Lenguaje Natural

#### Análisis de Intenciones
```typescript
// Ejemplos de patrones reconocidos
"crea un tablero" → intent: "crear_tablero"
"elimina la tarea" → intent: "eliminar_tarea"
"mueve a hecho" → intent: "mover_tarea"
```

#### Extracción de Entidades
```typescript
// Entidades extraídas automáticamente
{
  tablero_nombre: "Proyecto Web",
  tarea_titulo: "Diseñar Logo",
  columna_nombre: "En Revisión",
  prioridad: "Alta",
  fecha_vencimiento: "2024-01-15"
}
```

## 🗄️ Base de Datos

### MongoDB Collections

#### Boards
```typescript
interface Board {
  _id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}
```

#### Columns
```typescript
interface Column {
  _id: string
  name: string
  boardId: string
  order: number
  createdAt: string
  updatedAt: string
}
```

#### Tasks
```typescript
interface Task {
  _id: string
  title: string
  description?: string
  columnId: string
  boardId: string
  priority: "Alta" | "Media" | "Baja"
  dueDate?: string
  members: string[]
  createdAt: string
  updatedAt: string
}
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- pnpm (recomendado) o npm
- MongoDB Atlas (base de datos en la nube)

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/agenda-inteligente-x6.git
cd agenda-inteligente-x6
```

### 2. Instalar Dependencias
```bash
pnpm install
```

### 3. Configurar Variables de Entorno
Crear archivo `.env.local`:
```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/task-manager
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Ejecutar en Desarrollo
```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`

### 5. Construir para Producción
```bash
pnpm build
pnpm start
```

## 💬 Comandos de Ejemplo

### Gestión de Tableros
```
"Crea un tablero llamado Proyecto Web"
"Elimina el tablero actual"
"Cambia el nombre del tablero a Marketing Digital"
"Muéstrame todos los tableros"
```

### Gestión de Columnas
```
"Crea una columna llamada En Revisión"
"Elimina la columna Pendiente"
"Cambia el nombre de la columna Haciendo a En Progreso"
```

### Gestión de Tareas
```
"Crea una tarea llamada Diseñar Logo con prioridad alta"
"Elimina la tarea Reunión de Equipo"
"Mueve la tarea Diseñar Logo a la columna Hecho"
"Cambia la prioridad de la tarea a Media"
"Agrega fecha de vencimiento 15 de enero a la tarea"
```

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Next.js 15**: Framework de React con SSR/SSG
- **React 19**: Biblioteca de interfaz de usuario
- **TypeScript**: Tipado estático para JavaScript
- **Tailwind CSS**: Framework de CSS utilitario
- **Radix UI**: Componentes de interfaz accesibles
- **Lucide React**: Iconografía moderna

### Backend
- **Next.js API Routes**: API endpoints integrados
- **MongoDB**: Base de datos NoSQL
- **MongoDB Driver**: Cliente oficial para Node.js

### Herramientas de Desarrollo
- **pnpm**: Gestor de paquetes rápido
- **ESLint**: Linter para JavaScript/TypeScript
- **PostCSS**: Procesador de CSS
- **Autoprefixer**: Prefijos CSS automáticos

## 📱 Características de UX/UI

### Diseño Responsivo
- Adaptable a móviles, tablets y desktop
- Navegación optimizada para cada dispositivo
- Componentes que se ajustan automáticamente

### Accesibilidad
- Componentes Radix UI con soporte ARIA
- Navegación por teclado
- Contraste adecuado en temas claro/oscuro

### Feedback Visual
- Estados de carga con spinners
- Mensajes de confirmación
- Indicadores de prioridad por colores
- Animaciones suaves y transiciones

## 🔧 Configuración Avanzada

### Personalización de Reglas
Las reglas del motor de inferencia se pueden modificar en:
- `lib/rules/board-rules.ts`
- `lib/rules/column-rules.ts`
- `lib/rules/task-rules.ts`

### Extensión del NLP
Para agregar nuevas intenciones:
1. Modificar `lib/nlp/intent-analyzer.ts`
2. Agregar patrones de reconocimiento
3. Crear reglas correspondientes

### Personalización de UI
- Temas en `components/theme-provider.tsx`
- Componentes base en `components/ui/`
- Estilos globales en `app/globals.css`

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Desplegar automáticamente

### Otros Proveedores
- **Netlify**: Compatible con Next.js
- **Railway**: Soporte para MongoDB
- **Heroku**: Con add-on de MongoDB

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

- **Issues**: Reportar bugs en GitHub Issues
- **Documentación**: Consultar este README
- **Comunidad**: Unirse a discusiones en GitHub Discussions

## 🔮 Roadmap

### Próximas Características
- [ ] Integración con calendarios externos
- [ ] Notificaciones push
- [ ] Exportación de datos
- [ ] Plantillas de tableros
- [ ] Integración con Slack/Discord
- [ ] Análisis de productividad
- [ ] Modo offline
- [ ] API pública para integraciones

### Mejoras Técnicas
- [ ] Cache inteligente
- [ ] Optimización de consultas MongoDB
- [ ] Tests automatizados
- [ ] CI/CD pipeline
- [ ] Monitoreo y analytics

---

**Desarrollado con ❤️ usando Next.js, React y MongoDB**
