/**
 * GESTIÓN DE CATEGORÍAS
 * CRUD completo de categorías, selector interactivo de colores y emojis, conteo de existencias
 */

let allCategories = [];
let allProducts = [];
let categoryToDeleteId = null;

// Elementos del DOM
const categoriesGrid = document.getElementById('categories-grid');
const searchCategoryInput = document.getElementById('search-category-input');
const categoriesCountBadge = document.getElementById('categories-count-badge');
const emptyStateCats = document.getElementById('empty-state-cats');

// Modal Formulario Categoría
const categoryModal = document.getElementById('category-modal');
const categoryForm = document.getElementById('category-form');
const modalCategoryTitle = document.getElementById('modal-category-title');
const openCategoryModalBtn = document.getElementById('open-category-modal-btn');
const closeCategoryModal = document.getElementById('close-category-modal');
const cancelCategoryModal = document.getElementById('cancel-category-modal');
const emptyAddCatBtn = document.getElementById('empty-add-cat-btn');

// Modal Eliminar
const deleteCatModal = document.getElementById('delete-cat-modal');
const confirmDeleteCatBtn = document.getElementById('confirm-delete-cat-btn');
const cancelDeleteCatBtn = document.getElementById('cancel-delete-cat-btn');
const closeDeleteCatModal = document.getElementById('close-delete-cat-modal');
const deleteCatName = document.getElementById('delete-cat-name');
const deleteCatWarning = document.getElementById('delete-cat-warning');

// Cargar Datos
async function loadCategoriesPage() {
  try {
    const [cats, prods] = await Promise.all([
      window.db.getCategorias(),
      window.db.getProductos()
    ]);

    allCategories = cats;
    allProducts = prods;

    renderCategories();
    checkUrlParams();
  } catch (err) {
    console.error('Error cargando categorías:', err);
    if (window.showToast) window.showToast('Error', 'No se pudieron cargar las categorías', 'error');
  }
}

// Renderizar Categorías
function renderCategories() {
  const searchTerm = (searchCategoryInput ? searchCategoryInput.value : '').toLowerCase().trim();

  // Filtrar
  const filtered = allCategories.filter(cat => {
    return !searchTerm ||
      (cat.nombre && cat.nombre.toLowerCase().includes(searchTerm)) ||
      (cat.descripcion && cat.descripcion.toLowerCase().includes(searchTerm));
  });

  if (categoriesCountBadge) categoriesCountBadge.textContent = allCategories.length;

  if (filtered.length === 0) {
    if (categoriesGrid) categoriesGrid.style.display = 'none';
    if (emptyStateCats) emptyStateCats.style.display = 'block';
    return;
  }

  if (emptyStateCats) emptyStateCats.style.display = 'none';
  if (categoriesGrid) categoriesGrid.style.display = 'grid';

  // Mapa de conteo y valor por categoría
  const statsMap = {};
  allProducts.forEach(p => {
    const cid = String(p.categoria_id);
    if (!statsMap[cid]) statsMap[cid] = { count: 0, totalVal: 0 };
    const stock = parseInt(p.stock, 10) || 0;
    const precio = parseFloat(p.precio) || 0;
    statsMap[cid].count++;
    statsMap[cid].totalVal += (stock * precio);
  });

  categoriesGrid.innerHTML = filtered.map(cat => {
    const cid = String(cat.id);
    const stats = statsMap[cid] || { count: 0, totalVal: 0 };
    const color = cat.color || '#6366f1';
    const icon = cat.icono || '🏷️';

    return `
      <div class="category-card" style="--cat-color: ${color};">
        <div class="category-card-stripe"></div>
        
        <div class="category-card-header">
          <div class="category-card-icon" style="background-color: ${color}20; color: ${color};">
            ${icon}
          </div>
          <div class="action-buttons">
            <button class="btn-table-action edit" onclick="openEditCategoryModal('${cat.id}')" title="Editar categoría">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            </button>
            <button class="btn-table-action delete" onclick="openDeleteCategoryModal('${cat.id}')" title="Eliminar categoría">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        <h3 class="category-card-title">${escapeHtml(cat.nombre)}</h3>
        <p class="category-card-desc">${escapeHtml(cat.descripcion || 'Sin descripción asignada para esta categoría.')}</p>

        <div class="category-card-meta">
          <div class="category-card-count">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            <span>${stats.count} productos</span>
          </div>
          <div style="font-weight: 700; color: var(--text-primary); font-size: 0.875rem;">
            ${window.formatCurrency(stats.totalVal)}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Modal Crear Nueva Categoría
function openNewCategoryModal() {
  if (!categoryForm) return;
  categoryForm.reset();
  document.getElementById('cat-id').value = '';
  document.getElementById('cat-color').value = '#6366f1';
  document.getElementById('cat-icono').value = '🏷️';
  updateColorPickerUI('#6366f1');

  modalCategoryTitle.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
    Nueva Categoría
  `;
  categoryModal.classList.add('open');
}

// Modal Editar Categoría
function openEditCategoryModal(id) {
  const cat = allCategories.find(c => String(c.id) === String(id));
  if (!cat) return;

  document.getElementById('cat-id').value = cat.id;
  document.getElementById('cat-nombre').value = cat.nombre || '';
  document.getElementById('cat-icono').value = cat.icono || '🏷️';
  document.getElementById('cat-color').value = cat.color || '#6366f1';
  document.getElementById('cat-descripcion').value = cat.descripcion || '';
  updateColorPickerUI(cat.color || '#6366f1');

  modalCategoryTitle.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
    Editar Categoría
  `;
  categoryModal.classList.add('open');
}

function closeCategoryModalFunc() {
  categoryModal.classList.remove('open');
}

// Selector visual de colores
function setupColorPicker() {
  const options = document.querySelectorAll('.color-option');
  options.forEach(opt => {
    opt.addEventListener('click', () => {
      const color = opt.getAttribute('data-color');
      document.getElementById('cat-color').value = color;
      updateColorPickerUI(color);
    });
  });

  // Selector de presets de emoji
  const presets = document.querySelectorAll('.emoji-preset');
  presets.forEach(p => {
    p.addEventListener('click', () => {
      document.getElementById('cat-icono').value = p.textContent.trim();
    });
  });
}

function updateColorPickerUI(selectedColor) {
  const options = document.querySelectorAll('.color-option');
  options.forEach(opt => {
    if (opt.getAttribute('data-color').toLowerCase() === selectedColor.toLowerCase()) {
      opt.classList.add('selected');
    } else {
      opt.classList.remove('selected');
    }
  });
}

// Guardar Categoría
async function handleCategorySubmit(e) {
  e.preventDefault();

  const id = document.getElementById('cat-id').value;
  const nombre = document.getElementById('cat-nombre').value.trim();
  const icono = document.getElementById('cat-icono').value.trim() || '🏷️';
  const color = document.getElementById('cat-color').value || '#6366f1';
  const descripcion = document.getElementById('cat-descripcion').value.trim();

  const catData = {
    id: id || undefined,
    nombre,
    icono,
    color,
    descripcion
  };

  closeCategoryModalFunc();
  const isEditing = !!id;

  try {
    await window.db.saveCategoria(catData);
    window.showToast(
      isEditing ? 'Categoría actualizada' : 'Categoría creada',
      `"${nombre}" se guardó correctamente.`,
      'success'
    );
    await loadCategoriesPage();
  } catch (err) {
    console.error('Error guardando categoría:', err);
    window.showToast('Error', 'No se pudo guardar la categoría', 'error');
  }
}

// Modal Eliminar Categoría
function openDeleteCategoryModal(id) {
  const cat = allCategories.find(c => String(c.id) === String(id));
  if (!cat) return;

  categoryToDeleteId = id;
  deleteCatName.textContent = `"${cat.nombre}"`;

  const prodsInCat = allProducts.filter(p => String(p.categoria_id) === String(id)).length;
  if (prodsInCat > 0) {
    deleteCatWarning.style.display = 'block';
    deleteCatWarning.textContent = `⚠️ Esta categoría contiene ${prodsInCat} producto(s) asociado(s). Si la eliminas, quedarán sin categoría.`;
  } else {
    deleteCatWarning.style.display = 'none';
  }

  deleteCatModal.classList.add('open');
}

function closeDeleteCatModalFunc() {
  deleteCatModal.classList.remove('open');
  categoryToDeleteId = null;
}

async function handleConfirmDeleteCat() {
  if (!categoryToDeleteId) return;

  const id = categoryToDeleteId;
  closeDeleteCatModalFunc();

  try {
    await window.db.deleteCategoria(id);
    window.showToast('Categoría eliminada', 'La categoría ha sido eliminada con éxito.', 'success');
    await loadCategoriesPage();
  } catch (err) {
    console.error('Error eliminando categoría:', err);
    window.showToast('Error', 'No se pudo eliminar la categoría', 'error');
  }
}

function checkUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  if (action === 'new') {
    setTimeout(() => openNewCategoryModal(), 150);
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

window.reloadPageData = loadCategoriesPage;
window.openEditCategoryModal = openEditCategoryModal;
window.openDeleteCategoryModal = openDeleteCategoryModal;

// Configuración de Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  setupColorPicker();

  if (searchCategoryInput) searchCategoryInput.addEventListener('input', renderCategories);

  if (openCategoryModalBtn) openCategoryModalBtn.addEventListener('click', openNewCategoryModal);
  if (emptyAddCatBtn) emptyAddCatBtn.addEventListener('click', openNewCategoryModal);
  if (closeCategoryModal) closeCategoryModal.addEventListener('click', closeCategoryModalFunc);
  if (cancelCategoryModal) cancelCategoryModal.addEventListener('click', closeCategoryModalFunc);
  if (categoryForm) categoryForm.addEventListener('submit', handleCategorySubmit);

  if (confirmDeleteCatBtn) confirmDeleteCatBtn.addEventListener('click', handleConfirmDeleteCat);
  if (cancelDeleteCatBtn) cancelDeleteCatBtn.addEventListener('click', closeDeleteCatModalFunc);
  if (closeDeleteCatModal) closeDeleteCatModal.addEventListener('click', closeDeleteCatModalFunc);

  if (categoryModal) {
    categoryModal.addEventListener('click', (e) => {
      if (e.target === categoryModal) closeCategoryModalFunc();
    });
  }
  if (deleteCatModal) {
    deleteCatModal.addEventListener('click', (e) => {
      if (e.target === deleteCatModal) closeDeleteCatModalFunc();
    });
  }

  loadCategoriesPage();
});
