/**
 * GESTIÓN DE PRODUCTOS
 * CRUD completo, filtrado en tiempo real, cambio de vistas y exportación CSV
 */

let allProducts = [];
let allCategories = [];
let currentView = localStorage.getItem('inv_products_view') || 'table';
let productToDeleteId = null;

// Elementos del DOM
const productsTbody = document.getElementById('products-tbody');
const cardsContainer = document.getElementById('cards-container');
const tableContainer = document.getElementById('table-container');
const emptyState = document.getElementById('empty-state');

const searchInput = document.getElementById('search-input');
const filterCategory = document.getElementById('filter-category');
const filterStock = document.getElementById('filter-stock');
const sortBy = document.getElementById('sort-by');

const viewTableBtn = document.getElementById('view-table-btn');
const viewGridBtn = document.getElementById('view-grid-btn');

// Modales
const productModal = document.getElementById('product-modal');
const productForm = document.getElementById('product-form');
const modalProductTitle = document.getElementById('modal-product-title');
const openProductModalBtn = document.getElementById('open-product-modal-btn');
const closeProductModal = document.getElementById('close-product-modal');
const cancelProductModal = document.getElementById('cancel-product-modal');

const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const closeDeleteModal = document.getElementById('close-delete-modal');
const deleteProductName = document.getElementById('delete-product-name');

const exportCsvBtn = document.getElementById('export-csv-btn');
const emptyStateAddBtn = document.getElementById('empty-state-add-btn');

// Cargar Datos Iniciales
async function loadProductsPage() {
  try {
    const [prods, cats] = await Promise.all([
      window.db.getProductos(),
      window.db.getCategorias()
    ]);

    allProducts = prods;
    allCategories = cats;

    populateCategorySelectors();
    applyFiltersAndRender();
    checkUrlParams();
  } catch (error) {
    console.error('Error cargando productos:', error);
    if (window.showToast) window.showToast('Error', 'No se pudieron cargar los productos', 'error');
  }
}

// Llenar selectores de categorías (Filtro y Formulario)
function populateCategorySelectors() {
  const formCatSelect = document.getElementById('prod-categoria');
  
  if (filterCategory) {
    const currentVal = filterCategory.value;
    filterCategory.innerHTML = '<option value="">Todas las Categorías</option>' +
      allCategories.map(c => `<option value="${c.id}">${c.icono || ''} ${escapeHtml(c.nombre)}</option>`).join('');
    filterCategory.value = currentVal;
  }

  if (formCatSelect) {
    formCatSelect.innerHTML = '<option value="">Selecciona una categoría</option>' +
      allCategories.map(c => `<option value="${c.id}">${c.icono || ''} ${escapeHtml(c.nombre)}</option>`).join('');
  }
}

// Filtrar, Ordenar y Renderizar
function applyFiltersAndRender() {
  const searchTerm = (searchInput ? searchInput.value : '').toLowerCase().trim();
  const selectedCat = filterCategory ? filterCategory.value : '';
  const selectedStock = filterStock ? filterStock.value : '';
  const currentSort = sortBy ? sortBy.value : 'nombre_asc';

  let filtered = allProducts.filter(item => {
    // Búsqueda por texto (nombre, SKU, descripción)
    const matchesSearch = !searchTerm || 
      (item.nombre && item.nombre.toLowerCase().includes(searchTerm)) ||
      (item.codigo && item.codigo.toLowerCase().includes(searchTerm)) ||
      (item.descripcion && item.descripcion.toLowerCase().includes(searchTerm));

    // Filtro por categoría
    const matchesCat = !selectedCat || String(item.categoria_id) === String(selectedCat);

    // Filtro por estado de stock
    let matchesStock = true;
    const stock = parseInt(item.stock, 10) || 0;
    const stockMin = parseInt(item.stock_minimo, 10) || 5;

    if (selectedStock === 'in_stock') {
      matchesStock = stock > stockMin;
    } else if (selectedStock === 'low_stock') {
      matchesStock = stock > 0 && stock <= stockMin;
    } else if (selectedStock === 'out_of_stock') {
      matchesStock = stock === 0;
    }

    return matchesSearch && matchesCat && matchesStock;
  });

  // Ordenamiento
  filtered.sort((a, b) => {
    switch (currentSort) {
      case 'nombre_asc':
        return (a.nombre || '').localeCompare(b.nombre || '');
      case 'nombre_desc':
        return (b.nombre || '').localeCompare(a.nombre || '');
      case 'precio_asc':
        return (a.precio || 0) - (b.precio || 0);
      case 'precio_desc':
        return (b.precio || 0) - (a.precio || 0);
      case 'stock_asc':
        return (a.stock || 0) - (b.stock || 0);
      case 'stock_desc':
        return (b.stock || 0) - (a.stock || 0);
      default:
        return 0;
    }
  });

  // Mostrar / Ocultar estado vacío
  if (filtered.length === 0) {
    if (tableContainer) tableContainer.style.display = 'none';
    if (cardsContainer) cardsContainer.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
  } else {
    if (emptyState) emptyState.style.display = 'none';
    if (currentView === 'table') {
      if (tableContainer) tableContainer.style.display = 'block';
      if (cardsContainer) cardsContainer.style.display = 'none';
      renderTableView(filtered);
    } else {
      if (tableContainer) tableContainer.style.display = 'none';
      if (cardsContainer) cardsContainer.style.display = 'grid';
      renderGridView(filtered);
    }
  }
}

// Renderizar Vista Tabla
function renderTableView(items) {
  if (!productsTbody) return;

  productsTbody.innerHTML = items.map(item => {
    const stock = parseInt(item.stock, 10) || 0;
    const stockMin = parseInt(item.stock_minimo, 10) || 5;

    let badgeClass = 'badge-success';
    let badgeText = 'En Stock';

    if (stock === 0) {
      badgeClass = 'badge-danger';
      badgeText = 'Agotado';
    } else if (stock <= stockMin) {
      badgeClass = 'badge-warning';
      badgeText = 'Stock Bajo';
    }

    return `
      <tr>
        <td>
          <div class="product-cell">
            <div class="product-thumb">
              ${item.imagen_url ? `<img src="${item.imagen_url}" alt="${item.nombre}" onerror="this.src=''; this.parentElement.innerHTML='📦';">` : '📦'}
            </div>
            <div class="product-info">
              <span class="product-title">${escapeHtml(item.nombre)}</span>
              <span class="product-sku">${escapeHtml(item.codigo || 'SIN-SKU')}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="badge badge-category">${escapeHtml(item.categoria_nombre || 'General')}</span>
        </td>
        <td style="font-weight: 700; font-size: 0.95rem;">${window.formatCurrency(item.precio)}</td>
        <td style="font-weight: 600;">${stock} uds.</td>
        <td style="color: var(--text-muted); font-size: 0.85rem;">${stockMin} uds.</td>
        <td>
          <span class="badge ${badgeClass}">
            <span class="badge-dot"></span>
            ${badgeText}
          </span>
        </td>
        <td style="text-align: right;">
          <div class="action-buttons" style="justify-content: flex-end;">
            <button class="btn-table-action edit" onclick="openEditProductModal('${item.id}')" title="Editar producto">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            </button>
            <button class="btn-table-action delete" onclick="openDeleteProductModal('${item.id}')" title="Eliminar producto">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Renderizar Vista Grid (Tarjetas)
function renderGridView(items) {
  if (!cardsContainer) return;

  cardsContainer.innerHTML = items.map(item => {
    const stock = parseInt(item.stock, 10) || 0;
    const stockMin = parseInt(item.stock_minimo, 10) || 5;

    let badgeClass = 'badge-success';
    let badgeText = 'En Stock';

    if (stock === 0) {
      badgeClass = 'badge-danger';
      badgeText = 'Agotado';
    } else if (stock <= stockMin) {
      badgeClass = 'badge-warning';
      badgeText = `Bajo (${stock})`;
    }

    return `
      <div class="product-card">
        <div class="product-card-img-wrap">
          ${item.imagen_url ? `<img src="${item.imagen_url}" alt="${item.nombre}" onerror="this.src=''; this.parentElement.innerHTML='<span style=\\'font-size:3rem;\\'>📦</span>';">` : '<span style="font-size:3rem;">📦</span>'}
          <div class="product-card-badge">
            <span class="badge ${badgeClass}"><span class="badge-dot"></span>${badgeText}</span>
          </div>
        </div>
        <div class="product-card-body">
          <span class="product-card-cat">${escapeHtml(item.categoria_nombre || 'General')}</span>
          <h3 class="product-card-name">${escapeHtml(item.nombre)}</h3>
          <p class="product-card-desc">${escapeHtml(item.descripcion || 'Sin descripción adicional disponible.')}</p>
          <div class="product-card-footer">
            <div>
              <div class="product-card-price">${window.formatCurrency(item.precio)}</div>
              <div class="product-card-stock">Stock: <strong>${stock}</strong> uds. (Mín. ${stockMin})</div>
            </div>
            <div class="action-buttons">
              <button class="btn-table-action edit" onclick="openEditProductModal('${item.id}')" title="Editar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
              </button>
              <button class="btn-table-action delete" onclick="openDeleteProductModal('${item.id}')" title="Eliminar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Modal Crear / Editar Producto
function openNewProductModal() {
  if (!productForm) return;
  productForm.reset();
  document.getElementById('prod-id').value = '';
  document.getElementById('prod-stock-min').value = '5';
  modalProductTitle.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
    Nuevo Producto
  `;
  productModal.classList.add('open');
}

function openEditProductModal(id) {
  const prod = allProducts.find(p => String(p.id) === String(id));
  if (!prod) return;

  document.getElementById('prod-id').value = prod.id;
  document.getElementById('prod-nombre').value = prod.nombre || '';
  document.getElementById('prod-codigo').value = prod.codigo || '';
  document.getElementById('prod-categoria').value = prod.categoria_id || '';
  document.getElementById('prod-precio').value = prod.precio || 0;
  document.getElementById('prod-stock').value = prod.stock || 0;
  document.getElementById('prod-stock-min').value = prod.stock_minimo || 5;
  document.getElementById('prod-imagen').value = prod.imagen_url || '';
  document.getElementById('prod-descripcion').value = prod.descripcion || '';

  modalProductTitle.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
    Editar Producto
  `;
  productModal.classList.add('open');
}

function closeProductModalFunc() {
  productModal.classList.remove('open');
}

// Guardar Producto
async function handleProductSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('prod-id').value;
  const nombre = document.getElementById('prod-nombre').value.trim();
  const codigo = document.getElementById('prod-codigo').value.trim();
  const categoriaId = document.getElementById('prod-categoria').value;
  const precio = parseFloat(document.getElementById('prod-precio').value);
  const stock = parseInt(document.getElementById('prod-stock').value, 10);
  const stockMin = parseInt(document.getElementById('prod-stock-min').value, 10) || 5;
  const imagen = document.getElementById('prod-imagen').value.trim();
  const descripcion = document.getElementById('prod-descripcion').value.trim();

  const matchedCat = allCategories.find(c => String(c.id) === String(categoriaId));
  const categoriaNombre = matchedCat ? matchedCat.nombre : 'General';

  const productData = {
    id: id || undefined,
    nombre,
    codigo,
    categoria_id: categoriaId,
    categoria_nombre: categoriaNombre,
    precio,
    stock,
    stock_minimo: stockMin,
    imagen_url: imagen,
    descripcion
  };

  closeProductModalFunc();
  const isEditing = !!id;

  try {
    await window.db.saveProducto(productData);
    window.showToast(
      isEditing ? 'Producto actualizado' : 'Producto creado',
      `"${nombre}" se guardó con éxito en el inventario.`,
      'success'
    );
    await loadProductsPage();
  } catch (err) {
    console.error('Error guardando producto:', err);
    window.showToast('Error', 'No se pudo guardar el producto', 'error');
  }
}

// Modal Eliminar Producto
function openDeleteProductModal(id) {
  const prod = allProducts.find(p => String(p.id) === String(id));
  if (!prod) return;

  productToDeleteId = id;
  deleteProductName.textContent = `"${prod.nombre}" (${prod.codigo || 'SKU'})`;
  deleteModal.classList.add('open');
}

function closeDeleteModalFunc() {
  deleteModal.classList.remove('open');
  productToDeleteId = null;
}

async function handleConfirmDelete() {
  if (!productToDeleteId) return;

  const id = productToDeleteId;
  closeDeleteModalFunc();

  try {
    await window.db.deleteProducto(id);
    window.showToast('Producto eliminado', 'El producto ha sido removido del inventario.', 'success');
    await loadProductsPage();
  } catch (err) {
    console.error('Error eliminando:', err);
    window.showToast('Error', 'No se pudo eliminar el producto', 'error');
  }
}

// Exportar a CSV
function exportToCsv() {
  if (allProducts.length === 0) {
    window.showToast('Sin datos', 'No hay productos para exportar', 'warning');
    return;
  }

  const headers = ['ID', 'Codigo SKU', 'Nombre', 'Categoria', 'Precio Unitario', 'Stock Actual', 'Stock Minimo', 'Descripcion'];
  const rows = allProducts.map(p => [
    p.id || '',
    `"${(p.codigo || '').replace(/"/g, '""')}"`,
    `"${(p.nombre || '').replace(/"/g, '""')}"`,
    `"${(p.categoria_nombre || '').replace(/"/g, '""')}"`,
    p.precio || 0,
    p.stock || 0,
    p.stock_minimo || 5,
    `"${(p.descripcion || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
    [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `inventario-productos-${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.showToast('Exportación Exitosa', 'El archivo CSV ha sido generado y descargado.', 'success');
}

// Cambiar Vistas (Tabla vs Grid)
function setView(view) {
  currentView = view;
  localStorage.setItem('inv_products_view', view);

  if (view === 'table') {
    viewTableBtn.classList.add('active');
    viewGridBtn.classList.remove('active');
  } else {
    viewGridBtn.classList.add('active');
    viewTableBtn.classList.remove('active');
  }

  applyFiltersAndRender();
}

// Revisar Parámetros de URL (?filtro=critico o ?edit=id o ?action=new)
function checkUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const filtro = urlParams.get('filtro');
  const editId = urlParams.get('edit');
  const action = urlParams.get('action');

  if (filtro === 'critico' && filterStock) {
    filterStock.value = 'low_stock';
    applyFiltersAndRender();
  }

  if (editId) {
    setTimeout(() => openEditProductModal(editId), 150);
  } else if (action === 'new') {
    setTimeout(() => openNewProductModal(), 150);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.reloadPageData = loadProductsPage;
window.openEditProductModal = openEditProductModal;
window.openDeleteProductModal = openDeleteProductModal;

// Configuración de Eventos
document.addEventListener('DOMContentLoaded', () => {
  // Listeners de búsqueda y filtros
  if (searchInput) searchInput.addEventListener('input', applyFiltersAndRender);
  if (filterCategory) filterCategory.addEventListener('change', applyFiltersAndRender);
  if (filterStock) filterStock.addEventListener('change', applyFiltersAndRender);
  if (sortBy) sortBy.addEventListener('change', applyFiltersAndRender);

  // Listeners de Vistas
  if (viewTableBtn) viewTableBtn.addEventListener('click', () => setView('table'));
  if (viewGridBtn) viewGridBtn.addEventListener('click', () => setView('grid'));

  // Modales
  if (openProductModalBtn) openProductModalBtn.addEventListener('click', openNewProductModal);
  if (emptyStateAddBtn) emptyStateAddBtn.addEventListener('click', openNewProductModal);
  if (closeProductModal) closeProductModal.addEventListener('click', closeProductModalFunc);
  if (cancelProductModal) cancelProductModal.addEventListener('click', closeProductModalFunc);
  if (productForm) productForm.addEventListener('submit', handleProductSubmit);

  if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModalFunc);
  if (closeDeleteModal) closeDeleteModal.addEventListener('click', closeDeleteModalFunc);

  if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportToCsv);

  // Cerrar modales al hacer clic fuera
  if (productModal) {
    productModal.addEventListener('click', (e) => {
      if (e.target === productModal) closeProductModalFunc();
    });
  }
  if (deleteModal) {
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) closeDeleteModalFunc();
    });
  }

  // Establecer vista inicial guardada
  setView(currentView);

  // Cargar datos
  loadProductsPage();
});
