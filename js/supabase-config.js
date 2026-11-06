/**
 * CONFIGURACIÓN Y CLIENTE DE SUPABASE + SERVICIO DE INVENTARIO
 * Maneja la conexión con Supabase y provee sincronización con fallback local (Modo Demo/Offline)
 */

// Claves por defecto iniciales
const DEFAULT_SUPABASE_URL = "https://vvdcwjhvegvyniyqinek.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_06T4LHJpy1Yznjrb9PDc6A_24dLc3F6";

// Cargar credenciales guardadas en localStorage si existen
let activeUrl = localStorage.getItem('inventory_supabase_url') || DEFAULT_SUPABASE_URL;
let activeKey = localStorage.getItem('inventory_supabase_key') || DEFAULT_SUPABASE_KEY;

// Cliente de Supabase
let supabaseClient = null;
let isSupabaseConnected = false;

// Inicializar cliente Supabase de manera segura
function initSupabase() {
  try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      supabaseClient = window.supabase.createClient(activeUrl, activeKey);
      window.supabaseClient = supabaseClient;
    }
  } catch (err) {
    console.warn("No se pudo instanciar el cliente de Supabase:", err);
  }
}

// Datos Semilla para Categorías iniciales (Modo Demo / Fallback)
const SEED_CATEGORIAS = [
  { id: 'cat-1', nombre: 'Electrónica', descripcion: 'Laptops, smartphones, periféricos y accesorios', color: '#6366f1', icono: '💻' },
  { id: 'cat-2', nombre: 'Muebles de Oficina', descripcion: 'Sillas ergonómicas, escritorios y estantes', color: '#10b981', icono: '🪑' },
  { id: 'cat-3', nombre: 'Periféricos', descripcion: 'Teclados, mouse, audífonos y cables', color: '#f59e0b', icono: '⌨️' },
  { id: 'cat-4', nombre: 'Papelería', descripcion: 'Cuadernos, bolígrafos, archivadores y papel', color: '#ec4899', icono: '📝' },
  { id: 'cat-5', nombre: 'Audio & Video', descripcion: 'Cámaras web, micrófonos, monitores y parlantes', color: '#8b5cf6', icono: '🎧' }
];

// Datos Semilla para Productos iniciales
const SEED_PRODUCTOS = [
  {
    id: 'prod-1',
    codigo: 'LAP-001',
    nombre: 'Laptop Pro 15" i7 16GB',
    categoria_id: 'cat-1',
    categoria_nombre: 'Electrónica',
    precio: 1250.00,
    stock: 14,
    stock_minimo: 5,
    descripcion: 'Laptop de alta gama para desarrollo y diseño, SSD 512GB.',
    imagen_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'prod-2',
    codigo: 'MOU-002',
    nombre: 'Mouse Inalámbrico Ergonómico',
    categoria_id: 'cat-3',
    categoria_nombre: 'Periféricos',
    precio: 35.50,
    stock: 28,
    stock_minimo: 10,
    descripcion: 'Mouse ergonómico con sensor óptico de alta precisión 4000 DPI.',
    imagen_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'prod-3',
    codigo: 'SIL-003',
    nombre: 'Silla Ergonómica Mesh Transpirable',
    categoria_id: 'cat-2',
    categoria_nombre: 'Muebles de Oficina',
    precio: 199.90,
    stock: 3, // Stock bajo
    stock_minimo: 5,
    descripcion: 'Silla con soporte lumbar ajustable y reposabrazos 3D.',
    imagen_url: 'https://images.unsplash.com/photo-1580481077195-c3a821a58875?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'prod-4',
    codigo: 'MON-004',
    nombre: 'Monitor Gamer 27" 144Hz IPS',
    categoria_id: 'cat-5',
    categoria_nombre: 'Audio & Video',
    precio: 280.00,
    stock: 0, // Agotado
    stock_minimo: 4,
    descripcion: 'Monitor Ultra HD con bordes delgados y tiempo de respuesta 1ms.',
    imagen_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'prod-5',
    codigo: 'TEC-005',
    nombre: 'Teclado Mecánico RGB Switch Brown',
    categoria_id: 'cat-3',
    categoria_nombre: 'Periféricos',
    precio: 75.00,
    stock: 19,
    stock_minimo: 6,
    descripcion: 'Teclado mecánico compacto 75% con iluminación RGB personalizable.',
    imagen_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'prod-6',
    codigo: 'MIC-006',
    nombre: 'Micrófono USB de Condensador',
    categoria_id: 'cat-5',
    categoria_nombre: 'Audio & Video',
    precio: 89.00,
    stock: 2, // Stock bajo
    stock_minimo: 5,
    descripcion: 'Micrófono cardioide profesional para podcasts, streaming y videollamadas.',
    imagen_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=60'
  }
];

// Servicio Centralizado de Base de Datos
const db = {
  // Inicializar almacenamiento local si está vacío
  initStorage() {
    if (!localStorage.getItem('inv_categorias')) {
      localStorage.setItem('inv_categorias', JSON.stringify(SEED_CATEGORIAS));
    }
    if (!localStorage.getItem('inv_productos')) {
      localStorage.setItem('inv_productos', JSON.stringify(SEED_PRODUCTOS));
    }
  },

  // Probar la conexión a Supabase con timeout seguro
  async checkConnection() {
    if (!supabaseClient) initSupabase();
    if (!supabaseClient) {
      isSupabaseConnected = false;
      return false;
    }

    try {
      // Timeout de 2.5s para no bloquear la interfaz
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout de conexión')), 2500)
      );

      const checkPromise = supabaseClient.from('categorias').select('count', { count: 'exact', head: true });
      const response = await Promise.race([checkPromise, timeoutPromise]);
      
      if (response && !response.error) {
        isSupabaseConnected = true;
      } else {
        isSupabaseConnected = false;
      }
    } catch (err) {
      isSupabaseConnected = false;
    }
    this.updateStatusBadge();
    return isSupabaseConnected;
  },

  // Actualizar el badge visual en la barra de navegación
  updateStatusBadge() {
    const badge = document.getElementById('connection-status-badge');
    const dot = document.getElementById('connection-dot');
    const text = document.getElementById('connection-status-text');
    if (!badge || !dot || !text) return;

    if (isSupabaseConnected) {
      dot.className = 'connection-dot online';
      text.textContent = 'Supabase Conectado';
      badge.title = `Conectado a: ${activeUrl} (Haz clic para configurar)`;
    } else {
      dot.className = 'connection-dot offline';
      text.textContent = 'Modo Local (Demo)';
      badge.title = 'Operando con almacenamiento local. Haz clic para configurar tu Supabase';
    }
  },

  // ================= CATEGORÍAS =================
  async getCategorias() {
    this.initStorage();
    if (isSupabaseConnected && supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('categorias').select('*').order('nombre');
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn("Fallo lectura Supabase, usando local:", e);
      }
    }
    return JSON.parse(localStorage.getItem('inv_categorias') || '[]');
  },

  async saveCategoria(categoria) {
    this.initStorage();
    let localCats = JSON.parse(localStorage.getItem('inv_categorias') || '[]');

    if (!categoria.id) {
      categoria.id = 'cat-' + Date.now();
      localCats.push(categoria);
    } else {
      const idx = localCats.findIndex(c => String(c.id) === String(categoria.id));
      if (idx !== -1) localCats[idx] = categoria;
      else localCats.push(categoria);
    }
    localStorage.setItem('inv_categorias', JSON.stringify(localCats));

    if (isSupabaseConnected && supabaseClient) {
      try {
        await supabaseClient.from('categorias').upsert(categoria);
      } catch (e) {
        console.error("Error sincronizando categoría con Supabase:", e);
      }
    }
    return categoria;
  },

  async deleteCategoria(id) {
    let localCats = JSON.parse(localStorage.getItem('inv_categorias') || '[]');
    localCats = localCats.filter(c => String(c.id) !== String(id));
    localStorage.setItem('inv_categorias', JSON.stringify(localCats));

    if (isSupabaseConnected && supabaseClient) {
      try {
        await supabaseClient.from('categorias').delete().eq('id', id);
      } catch (e) {
        console.error("Error eliminando categoría en Supabase:", e);
      }
    }
    return true;
  },

  // ================= PRODUCTOS =================
  async getProductos() {
    this.initStorage();
    if (isSupabaseConnected && supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('productos').select('*').order('nombre');
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn("Fallo lectura de productos Supabase, usando local:", e);
      }
    }
    return JSON.parse(localStorage.getItem('inv_productos') || '[]');
  },

  async saveProducto(producto) {
    this.initStorage();
    let localProds = JSON.parse(localStorage.getItem('inv_productos') || '[]');

    // Asegurar números válidos
    producto.precio = parseFloat(producto.precio) || 0;
    producto.stock = parseInt(producto.stock, 10) || 0;
    producto.stock_minimo = parseInt(producto.stock_minimo, 10) || 5;

    if (!producto.id) {
      producto.id = 'prod-' + Date.now();
      localProds.unshift(producto);
    } else {
      const idx = localProds.findIndex(p => String(p.id) === String(producto.id));
      if (idx !== -1) localProds[idx] = producto;
      else localProds.unshift(producto);
    }
    localStorage.setItem('inv_productos', JSON.stringify(localProds));

    if (isSupabaseConnected && supabaseClient) {
      try {
        await supabaseClient.from('productos').upsert(producto);
      } catch (e) {
        console.error("Error sincronizando producto con Supabase:", e);
      }
    }
    return producto;
  },

  async deleteProducto(id) {
    let localProds = JSON.parse(localStorage.getItem('inv_productos') || '[]');
    localProds = localProds.filter(p => String(p.id) !== String(id));
    localStorage.setItem('inv_productos', JSON.stringify(localProds));

    if (isSupabaseConnected && supabaseClient) {
      try {
        await supabaseClient.from('productos').delete().eq('id', id);
      } catch (e) {
        console.error("Error eliminando producto en Supabase:", e);
      }
    }
    return true;
  },

  // Actualizar credenciales y reconectar
  updateCredentials(newUrl, newKey) {
    activeUrl = (newUrl || '').trim();
    activeKey = (newKey || '').trim();
    localStorage.setItem('inventory_supabase_url', activeUrl);
    localStorage.setItem('inventory_supabase_key', activeKey);
    initSupabase();
    return this.checkConnection();
  },

  resetDefaultCredentials() {
    localStorage.removeItem('inventory_supabase_url');
    localStorage.removeItem('inventory_supabase_key');
    activeUrl = DEFAULT_SUPABASE_URL;
    activeKey = DEFAULT_SUPABASE_KEY;
    initSupabase();
    return this.checkConnection();
  }
};

// ==========================================================================
// Utilidades Compartidas (Notificaciones Toast, Formato de Moneda, Temas)
// ==========================================================================

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount || 0);
}

function showToast(title, message = '', type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`,
    error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`,
    warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
    info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 16v-4m0-4h.01"/></svg>`
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-message">${message}</div>` : ''}
    </div>
    <div class="toast-close">&times;</div>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

// Inicializar Tema Claro / Oscuro
function initTheme() {
  const savedTheme = localStorage.getItem('inv_theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('inv_theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;
  if (theme === 'dark') {
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
    btn.title = 'Cambiar a modo claro';
  } else {
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    btn.title = 'Cambiar a modo oscuro';
  }
}

// Configurar Modal de Conexión Supabase
function setupConfigModal() {
  const configBtn = document.getElementById('config-btn') || document.getElementById('connection-status-badge');
  const modal = document.getElementById('config-modal');
  const closeBtn = document.getElementById('close-config-modal');
  const cancelBtn = document.getElementById('cancel-config-btn');
  const form = document.getElementById('config-form');
  const resetBtn = document.getElementById('reset-config-btn');

  if (!modal) return;

  const openModal = () => {
    const urlInput = document.getElementById('supabase-url-input');
    const keyInput = document.getElementById('supabase-key-input');
    if (urlInput) urlInput.value = activeUrl;
    if (keyInput) keyInput.value = activeKey;
    modal.classList.add('open');
  };

  const closeModal = () => modal.classList.remove('open');

  if (configBtn) configBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = document.getElementById('supabase-url-input').value;
      const key = document.getElementById('supabase-key-input').value;
      closeModal();
      showToast('Conectando...', 'Verificando credenciales de Supabase', 'info');
      const ok = await db.updateCredentials(url, key);
      if (ok) {
        showToast('¡Conectado!', 'Conexión con Supabase establecida correctamente', 'success');
      } else {
        showToast('Modo Local', 'No se pudo conectar a Supabase. Se mantendrán los datos locales.', 'warning');
      }
      if (typeof window.reloadPageData === 'function') window.reloadPageData();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      closeModal();
      showToast('Restaurando...', 'Restaurando credenciales por defecto', 'info');
      await db.resetDefaultCredentials();
      if (typeof window.reloadPageData === 'function') window.reloadPageData();
    });
  }
}

// Menú Móvil
function setupMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
    });
  }
}

// Iniciar al cargar el DOM
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  setupMobileMenu();
  setupConfigModal();

  const themeToggle = document.getElementById('theme-toggle-btn');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  initSupabase();
  db.initStorage();
  await db.checkConnection();
});

// Exportar globalmente
window.db = db;
window.formatCurrency = formatCurrency;
window.showToast = showToast;
