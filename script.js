(() => {
  const products = Array.isArray(window.ACHOU_PRODUCTS) ? window.ACHOU_PRODUCTS : [];
  const $ = id => document.getElementById(id);
  const money = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const categoryIcons = { 'Celulares':'📱','Tênis':'👟','TVs':'📺','Livros':'📚','Moda':'👕','Moda fitness':'🏋️','Roupa de academia':'🏋️','Eletrônicos':'🎧','Casa e eletrodomésticos':'🏠' };
  let activeCategory = 'Todas';

  const categories = ['Todas', ...new Set(products.map(p => p.category).filter(Boolean))];

  function discount(p) {
    if (!p.oldPrice || !p.price || p.oldPrice <= p.price) return 0;
    return Math.round((1 - p.price / p.oldPrice) * 100);
  }

  function renderCategories() {
    const grid = $('categoryGrid');
    if (!grid) return;
    const counts = Object.fromEntries(categories.filter(c => c !== 'Todas').map(c => [c, products.filter(p => p.category === c).length]));
    grid.innerHTML = categories.filter(c => c !== 'Todas').map(c => `
      <button class="category-card" data-category="${escapeHtml(c)}">
        <span class="category-icon">${categoryIcons[c] || '🛍️'}</span>
        <strong>${escapeHtml(c)}</strong>
        <small>${counts[c] || 0} oferta(s)</small>
      </button>`).join('');

    const chips = $('filterChips');
    if (chips) chips.innerHTML = categories.map(c => `<button class="filter-chip ${c === activeCategory ? 'active':''}" data-category="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('');
  }

  function getVisibleProducts() {
    const q = ($('searchInput')?.value || '').trim().toLowerCase();
    let list = products.filter(p => (activeCategory === 'Todas' || p.category === activeCategory) && (!q || `${p.name} ${p.category} ${p.store}`.toLowerCase().includes(q)));
    const sort = $('sortSelect')?.value || 'featured';
    list = [...list].sort((a,b) => {
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      if (sort === 'discount') return discount(b) - discount(a);
      if (sort === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      return Number(b.featured) - Number(a.featured);
    });
    return list;
  }

  function renderProducts() {
    const list = getVisibleProducts();
    if ($('resultsCount')) $('resultsCount').textContent = list.length;
    const grid = $('productGrid');
    const empty = $('emptyState');
    if (!grid) return;
    empty.hidden = list.length > 0;
    grid.innerHTML = list.map(p => {
      const pct = discount(p);
      const media = p.image ? `<img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.name)}" loading="lazy">` : `<div class="product-emoji">${p.emoji || categoryIcons[p.category] || '🛍️'}</div>`;
      const button = p.link ? `<a class="offer-btn" href="${escapeAttr(p.link)}" target="_blank" rel="nofollow sponsored noopener">Ver oferta ↗</a>` : `<span class="offer-btn disabled">Exemplo</span>`;
      return `<article class="product-card ${p.featured ? 'featured':''}">
        <div class="product-media">${p.featured ? '<span class="featured-badge">DESTAQUE</span>':''}${p.isDemo ? '<span class="demo-badge">DEMONSTRAÇÃO</span>':''}${media}</div>
        <div class="product-content">
          <div class="product-meta"><span>${escapeHtml(p.store || 'Loja parceira')}</span><span>${escapeHtml(p.category || '')}</span></div>
          <h3>${escapeHtml(p.name)}</h3>
          <div class="price-wrap">${p.oldPrice ? `<span class="old-price">${money(p.oldPrice)}</span>`:''}<strong>${money(p.price)}</strong>${pct ? `<span class="discount">−${pct}%</span>`:''}</div>
          ${button}
          <small class="price-note">Preço, estoque e frete podem mudar; confira na loja.</small>
        </div>
      </article>`;
    }).join('');
  }

  function selectCategory(category) {
    activeCategory = category || 'Todas';
    renderCategories();
    renderProducts();
    document.querySelector('#ofertas')?.scrollIntoView({behavior:'smooth'});
  }

  document.addEventListener('click', e => {
    const target = e.target.closest('[data-category]');
    if (target) selectCategory(target.dataset.category);
  });
  $('searchInput')?.addEventListener('input', renderProducts);
  $('clearSearch')?.addEventListener('click', () => { $('searchInput').value=''; renderProducts(); });
  $('sortSelect')?.addEventListener('change', renderProducts);
  if ($('year')) $('year').textContent = new Date().getFullYear();

  function escapeHtml(v='') { return String(v).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function escapeAttr(v='') { return escapeHtml(v); }
  renderCategories();
  renderProducts();
})();
