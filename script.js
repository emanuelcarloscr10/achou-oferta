(() => {
  const baseProducts = Array.isArray(window.ACHOU_PRODUCTS) ? window.ACHOU_PRODUCTS : [];
  const coupons = Array.isArray(window.ACHOU_COUPONS) ? window.ACHOU_COUPONS : [];
  const localProducts = (() => {
    try {
      const raw = localStorage.getItem('achouOfertaProducts');
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  })();

  const products = Array.isArray(localProducts) && localProducts.length ? localProducts : baseProducts;
  let activeCategory = 'Todos';
  let query = '';
  let sort = 'featured';

  const $ = (id) => document.getElementById(id);
  const productGrid = $('productGrid');
  const couponGrid = $('couponGrid');
  const categoryGrid = $('categoryGrid');
  const filterChips = $('filterChips');
  const resultsCount = $('resultsCount');
  const emptyState = $('emptyState');
  const searchInput = $('searchInput');
  const clearSearch = $('clearSearch');
  const sortSelect = $('sortSelect');

  const money = (value) => new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL'
  }).format(Number(value || 0));

  const discountPct = (p) => {
    if (!p.oldPrice || Number(p.oldPrice) <= Number(p.price)) return 0;
    return Math.round((1 - Number(p.price) / Number(p.oldPrice)) * 100);
  };

  const normalize = (value) => String(value || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase();

  function matchesQuery(p, query) {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    if (!words.length) return true;
    const haystack = normalize(`${p.name} ${p.category} ${p.store} ${(p.keywords || []).join(' ')}`);
    return words.every(word => haystack.includes(word));
  }

  const categories = ['Todos', ...new Set(products.map(p => p.category).filter(Boolean))];

  function renderCategories() {
    if (!categoryGrid || !filterChips) return;
    const icons = {
      'Celulares': '📱', 'Tênis': '👟', 'TVs': '📺', 'Livros': '📚',
      'Moda': '👕', 'Eletrônicos': '🎧', 'Casa e eletrodomésticos': '🏠', 'Notebooks': '💻', 'Todos': '✨'
    };

    categoryGrid.innerHTML = categories.filter(c => c !== 'Todos').map(category => `
      <button class="category-card" data-category="${escapeHtml(category)}">
        <span class="category-icon">${icons[category] || '🛍️'}</span>
        <strong>${escapeHtml(category)}</strong>
        <small>Ver ofertas</small>
      </button>
    `).join('');

    filterChips.innerHTML = categories.map(category => `
      <button class="filter-chip ${category === activeCategory ? 'active' : ''}" data-category="${escapeHtml(category)}">
        ${category}
      </button>
    `).join('');

    document.querySelectorAll('#categoryNav [data-category]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === activeCategory);
    });
  }

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, c => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#039;', '"':'&quot;'
    }[c]));
  }

  function productImage(p) {
    if (p.image) {
      return `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy">`;
    }
    return `<div class="product-emoji" aria-hidden="true">${escapeHtml(p.emoji || '🛍️')}</div>`;
  }

  function renderCoupons() {
    if (!couponGrid) return;
    const today = new Date().toISOString().slice(0, 10);
    const active = coupons.filter(c => !c.validUntil || c.validUntil >= today);
    if (!active.length) {
      couponGrid.closest('.section')?.setAttribute('hidden', '');
      return;
    }
    couponGrid.innerHTML = active.map(c => {
      const until = c.validUntil ? new Date(`${c.validUntil}T00:00:00`).toLocaleDateString('pt-BR') : '';
      const minPurchase = c.minPurchase ? `Compra mínima ${money(c.minPurchase)}` : '';
      const terms = [minPurchase, until ? `Válido até ${until}` : ''].filter(Boolean).join(' · ');
      return `
        <article class="coupon-card">
          <span class="coupon-store">${escapeHtml(c.store)}${c.seller ? ' · ' + escapeHtml(c.seller) : ''}</span>
          <span class="coupon-value">${escapeHtml(c.discountLabel)}</span>
          <span class="coupon-desc">${escapeHtml(c.description || '')}</span>
          <span class="coupon-terms">${escapeHtml(terms)}${c.autoApply ? ' · Aplicado automaticamente no carrinho' : ''}</span>
          <a class="coupon-btn" href="${escapeHtml(c.link)}" target="_blank" rel="nofollow sponsored noopener">Ver produtos ↗</a>
        </article>`;
    }).join('');
  }

  function renderProducts() {
    if (!productGrid) return;
    let list = products.filter(p => {
      const categoryOk = activeCategory === 'Todos' || p.category === activeCategory;
      return categoryOk && matchesQuery(p, query);
    });

    list = [...list].sort((a, b) => {
      if (sort === 'price-asc') return Number(a.price) - Number(b.price);
      if (sort === 'price-desc') return Number(b.price) - Number(a.price);
      if (sort === 'discount') return discountPct(b) - discountPct(a);
      if (sort === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });

    if (resultsCount) resultsCount.textContent = list.length;
    if (emptyState) emptyState.hidden = list.length !== 0;

    productGrid.innerHTML = list.map(p => {
      const discount = discountPct(p);
      const hasLink = p.link && /^https?:\/\//i.test(p.link);
      const action = hasLink
        ? `<a class="offer-btn" href="${escapeHtml(p.link)}" target="_blank" rel="nofollow sponsored noopener" data-product-id="${escapeHtml(p.id)}">Ver oferta em ${escapeHtml(p.store)} ↗</a>`
        : `<button class="offer-btn disabled" disabled>${p.isDemo ? 'Exemplo' : 'Link indisponível'}</button>`;

      return `
        <article class="product-card ${p.featured ? 'featured' : ''}">
          <div class="product-media">
            ${p.featured ? '<span class="featured-badge">Destaque</span>' : ''}
            ${p.isDemo ? '<span class="demo-badge">Demonstração</span>' : ''}
            ${productImage(p)}
          </div>
          <div class="product-content">
            <div class="product-meta"><span>${escapeHtml(p.store)}</span><span>${escapeHtml(p.category)}</span></div>
            <h3>${escapeHtml(p.name)}</h3>
            <div class="price-wrap">
              ${p.oldPrice ? `<span class="old-price">${money(p.oldPrice)}</span>` : ''}
              ${discount ? `<span class="discount">−${discount}%</span>` : ''}
              <strong>${money(p.price)}</strong>
            </div>
            ${action}
            <small class="price-note">Preço, estoque e frete podem mudar. Confira na loja.</small>
          </div>
        </article>`;
    }).join('');
  }

  function setCategory(category) {
    activeCategory = category || 'Todos';
    renderCategories();
    renderProducts();
    document.getElementById('ofertas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.addEventListener('click', (event) => {
    const categoryButton = event.target.closest('[data-category]');
    if (categoryButton && !categoryButton.classList.contains('quick-filter') || categoryButton?.classList.contains('quick-filter')) {
      if (categoryButton?.dataset.category) setCategory(categoryButton.dataset.category);
    }

    const link = event.target.closest('[data-product-id]');
    if (link) {
      try {
        const key = 'achouOfertaClicks';
        const clicks = JSON.parse(localStorage.getItem(key) || '{}');
        clicks[link.dataset.productId] = (clicks[link.dataset.productId] || 0) + 1;
        localStorage.setItem(key, JSON.stringify(clicks));
      } catch (_) {}
    }
  });

  searchInput?.addEventListener('input', (e) => {
    query = e.target.value.trim();
    if (clearSearch) clearSearch.style.visibility = query ? 'visible' : 'hidden';
    renderProducts();
  });

  clearSearch?.addEventListener('click', () => {
    query = '';
    searchInput.value = '';
    clearSearch.style.visibility = 'hidden';
    renderProducts();
  });

  sortSelect?.addEventListener('change', (e) => {
    sort = e.target.value;
    renderProducts();
  });

  document.querySelectorAll('.quick-filter').forEach(btn => {
    btn.addEventListener('click', () => setCategory(btn.dataset.category));
  });

  if ($('year')) $('year').textContent = new Date().getFullYear();
  if (clearSearch) clearSearch.style.visibility = 'hidden';
  renderCategories();
  renderProducts();
  renderCoupons();
})();
