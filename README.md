# 📦 Sistema de Gestión de Inventario Pro (Supabase & CSS Moderno)

Un sistema web completo, moderno y elegante para la administración de inventarios, productos y categorías en tiempo real, conectado a **Supabase** y con soporte offline/demo automático.

---

## ✨ Características Principales

### 🎨 Diseño y CSS de Vanguardia
- **Modo Oscuro / Modo Claro:** Interruptor interactivo con persistencia en `localStorage` y paleta de colores de alto contraste inspirada en interfaces SaaS de primer nivel (Linear, Tailwind UI).
- **Tipografía y Jerarquía:** Diseñado con la fuente *Inter*, variables CSS nativas, efectos sutiles de glassmorphism, elevaciones y transiciones suaves.
- **100% Responsivo:** Adaptado para teléfonos inteligentes, tablets y pantallas de escritorio grandes con menú hamburguesa y controles táctiles.
- **Vistas Conmutables:** Visualización de productos en **Tabla Detallada** o **Cuadrícula de Tarjetas (Grid)** con un solo clic.

### 📊 Dashboard Inteligente (Panel de Control)
- **KPIs en tiempo real:**
  - Total de productos registrados.
  - Valor total del inventario calculado dinámicamente ($).
  - Conteo de categorías activas.
  - Alertas automáticas de stock bajo y productos agotados.
- **Monitoreo de Stock Crítico:** Tabla destacada con avisos prioritarios y botón directo para reponer existencias.
- **Distribución por Categorías:** Barras de progreso visuales con porcentaje y conteo de artículos.
- **Resumen de Existencias:** Diagnóstico visual rápido de stock saludable, stock bajo y agotados.

### 🛍️ Gestión de Productos (`productos.html`)
- **CRUD Completo:** Crear, visualizar, editar y eliminar productos con validación en tiempo real.
- **Filtros Avanzados:**
  - Buscador predictivo instantáneo (por nombre, código SKU o descripción).
  - Filtro por categoría.
  - Filtro por estado de stock (En Stock, Stock Bajo, Agotado).
  - Ordenamiento por Nombre (A-Z, Z-A), Precio (Mayor/Menor) y Stock (Mayor/Menor).
- **Exportación:** Exporta todo el catálogo a formato **CSV** compatible con Excel y Google Sheets.

### 🏷️ Gestión de Categorías (`categorias.html`)
- **Organización Visual:** Tarjetas con selector de colores temáticos y selector rápido de emojis/iconos (💻, 🪑, ⌨️, 🎧, etc.).
- **Métricas por Categoría:** Conteo de productos vinculados y valor monetario acumulado.
- **Protección contra borrado accidental:** Advertencia si la categoría contiene productos asociados.

### ⚡ Integración con Supabase + Modo Demo Automático
- Compatible con **Supabase JS SDK v2**.
- **Modo Resiliente / Offline:** Si las credenciales no están configuradas o el proyecto de Supabase se encuentra pausado, la aplicación conmuta inmediatamente a modo local con datos de muestra preinstalados, garantizando que el sistema siempre esté operativo.
- **Configuración desde la UI:** Modal integrado para actualizar la URL y la API Key de Supabase directamente desde la interfaz web sin editar código.

---

## 🛠️ Tecnologías Utilizadas

- **HTML5 Semántico**
- **CSS3 Moderno** (Variables CSS nativas, Flexbox, CSS Grid, Media Queries, Animaciones)
- **JavaScript Moderno (ES6+)** (Async/Await, Modular, Vanilla JS sin dependencias pesadas)
- **Supabase JS Client v2**

---

## 🚀 Puesta en Marcha Rápida

1. Clona el repositorio:
   ```bash
   git clone https://github.com/santiagobillada05-pixel/inventario-supabase.git
   cd inventario-supabase
   ```

2. Abre `index.html` en tu navegador favorito (o ejecútalo mediante la extensión Live Server de VS Code o `npx serve`).

---

## 🗄️ Esquema SQL para Supabase

Si deseas conectar tu propia base de datos en Supabase, ejecuta las siguientes instrucciones en el **SQL Editor** de tu consola de Supabase:

```sql
-- 1. Tabla de Categorías
create table public.categorias (
  id text primary key,
  nombre text not null,
  descripcion text,
  color text default '#6366f1',
  icono text default '🏷️',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Tabla de Productos
create table public.productos (
  id text primary key,
  codigo text not null,
  nombre text not null,
  categoria_id text references public.categorias(id) on delete set null,
  categoria_nombre text,
  precio numeric(10,2) not null default 0,
  stock integer not null default 0,
  stock_minimo integer default 5,
  descripcion text,
  imagen_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Habilitar RLS (opcional si es para acceso anónimo en desarrollo)
alter table public.categorias enable row level security;
alter table public.productos enable row level security;

create policy "Permitir lectura publica de categorias" on public.categorias for select using (true);
create policy "Permitir insercion/edicion de categorias" on public.categorias for all using (true);

create policy "Permitir lectura publica de productos" on public.productos for select using (true);
create policy "Permitir insercion/edicion de productos" on public.productos for all using (true);
```

---

## 📁 Estructura del Proyecto

```
inventario-supabase/
├── css/
│   └── styles.css          # Sistema de diseño completo, variables, modo oscuro
├── js/
│   ├── supabase-config.js  # Conexión Supabase, fallback local y utilidades
│   ├── dashboard.js        # Lógica del panel principal y métricas
│   ├── productos.js        # Lógica CRUD, filtros y exportación de productos
│   └── categorias.js       # Lógica CRUD de categorías y selector visual
├── categorias.html         # Página de categorías
├── index.html              # Dashboard / Panel Principal
├── productos.html          # Página de productos
├── .gitignore
└── README.md
```

---

## 👤 Autor

Desarrollado por **Santiago Billada** ([@santiagobillada05-pixel](https://github.com/santiagobillada05-pixel)).
Licencia MIT.
