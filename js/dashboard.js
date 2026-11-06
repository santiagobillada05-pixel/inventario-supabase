/**
 * LÓGICA DEL DASHBOARD DE INVENTARIO
 * Carga de estadísticas, productos críticos, distribución y métricas clave
 */

async function loadDashboardData() {
  try {
    const [productos, categorias] = await Promise.all([
      window.db.getProductos(),
      window.db.getCategorias()
    ]);

    // 1. Calcular KPIs
    const totalProductos = productos.length;
    const totalCategorias = categorias.length;
    
    let valorTotalInventario = 0;
    let stockNormalCount = 0;
    let stockBajoCount = 0;
    let stockAgotadoCount = 0;
    const productosCriticos = [];

    productos.forEach(prod => {
      const precio = parseFloat(prod.precio) || 0;
      const stock = parseInt(prod.stock, 10) || 0;
      const stockMin = parseInt(prod.stock_minimo, 10) || 5;

      valorTotalInventario += (precio * stock);

      if (stock === 0) {
        stockAgotadoCount++;
        productosCriticos.push(prod);
      } else if (stock <= stockMin) {
        stockBajoCount++;
        productosCriticos.push(prod);
      } else {
        stockNormalCount++;
      }
    });

    const totalAlertas = stockBajoCount + stockAgotadoCount;

    // Actualizar elementos KPI
    const statProds = document.getElementById('stat-total-productos');
    const statValor = document.getElementById('stat-valor-inventario');
    const statCats = document.getElementById('stat-total-categorias');
    const statAlerts = document.getElementById('stat-alertas-stock');

    if (statProds) statProds.textContent = totalProductos;
    if (statValor) statValor.textContent = window.formatCurrency(valorTotalInventario);
    if (statCats) statCats.textContent = totalCategorias;
    if (statAlerts) statAlerts.textContent = totalAlertas;

    // Resumen de existencias
    const sumInStock = document.getElementById('summary-in-stock');
    const sumLowStock = document.getElementById('summary-low-stock');
    const sumOutStock = document.getElementById('summary-out-stock');
    if (sumInStock) sumInStock.textContent = stockNormalCount;
    if (sumLowStock) sumLowStock.textContent = stockBajoCount;
    if (sumOutStock) sumOutStock.textContent = stockAgotadoCount;

    // 2. Renderizar Productos Críticos
    renderCriticalProducts(productosCriticos);

    // 3. Renderizar Últimos Productos
    renderRecentProducts(productos.slice(0, 6));

    // 4. Renderizar Distribución por Categorías
    renderCategoryDistribution(categorias, productos);

  } catch (error) {
    console.error('Error cargando datos del dashboard:', error);
    if (window.showToast) {
      window.showToast('Error', 'No se pudieron cargar las estadísticas', 'error');
    }
  }
}

function renderCriticalProducts(criticos) {
  const tbody = document.getElementById('critical-products-tbody');
  const alertCard = document.getElementById('alert-box-card');
  if (!tbody) return;

  if (criticos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--success); padding: 1.75rem 1rem;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 600;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            ¡Excelente! Todos los productos cuentan con niveles de stock saludables.
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = criticos.map(item => {
    const isOut = item.stock === 0;
    const badgeClass = isOut ? 'badge-danger' : 'badge-warning';
    const badgeText = isOut ? 'Agotado (0)' : `Bajo (${item.stock})`;

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
        <td><span class="badge badge-category">${escapeHtml(item.categoria_nombre || 'General')}</span></td>
        <td><span class="badge ${badgeClass}"><span class="badge-dot"></span>${badgeText}</span></td>
        <td style="color: var(--text-secondary); font-weight: 500;">${item.stock_minimo || 5} uds.</td>
        <td>
          <a href="productos.html?edit=${item.id}" class="btn btn-secondary btn-sm" style="gap: 0.35rem;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14m-7-7h14"/></svg>
            Reponer
          </a>
        </td>
      </tr>
    `;
  }).join('');
}

function renderRecentProducts(recientes) {
  const tbody = document.getElementById('recent-products-tbody');
  if (!tbody) return;

  if (recientes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
          No hay productos registrados aún.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = recientes.map(item => {
    let stockBadge = '<span class="badge badge-success"><span class="badge-dot"></span>En Stock</span>';
    if (item.stock === 0) {
      stockBadge = '<span class="badge badge-danger"><span class="badge-dot"></span>Agotado</span>';
    } else if (item.stock <= (item.stock_minimo || 5)) {
      stockBadge = '<span class="badge badge-warning"><span class="badge-dot"></span>Bajo</span>';
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
        <td><span class="badge badge-category">${escapeHtml(item.categoria_nombre || 'General')}</span></td>
        <td style="font-weight: 700;">${window.formatCurrency(item.precio)}</td>
        <td style="font-weight: 600;">${item.stock} uds.</td>
        <td>${stockBadge}</td>
      </tr>
    `;
  }).join('');
}

function renderCategoryDistribution(categorias, productos) {
  const listContainer = document.getElementById('category-distribution-list');
  if (!listContainer) return;

  if (categorias.length === 0) {
    listContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted);">Sin categorías registradas.</p>`;
    return;
  }

  const totalProductos = productos.length || 1;

  // Contar productos por categoría
  const countMap = {};
  productos.forEach(p => {
    const catId = p.categoria_id;
    countMap[catId] = (countMap[catId] || 0) + 1;
  });

  listContainer.innerHTML = categorias.map(cat => {
    const count = countMap[cat.id] || 0;
    const percentage = Math.round((count / totalProductos) * 100);
    const color = cat.color || '#6366f1';

    return `
      <div class="category-progress-item">
        <div class="category-progress-header">
          <div class="category-name-tag">
            <span class="category-color-dot" style="background-color: ${color};"></span>
            <span>${cat.icono || '🏷️'} ${escapeHtml(cat.nombre)}</span>
          </div>
          <span class="category-stats-tag">${count} prods. (${percentage}%)</span>
        </div>
        <div class="progress-track">
          <div class="progress-bar" style="width: ${percentage}%; background-color: ${color};"></div>
        </div>
      </div>
    `;
  }).join('');
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

window.reloadPageData = loadDashboardData;

document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
});
