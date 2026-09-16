(() => {
  const STORAGE = 'achouOfertaProducts';
  const DEFAULTS = Array.isArray(window.ACHOU_PRODUCTS) ? window.ACHOU_PRODUCTS : [];
  const $ = (id) => document.getElementById(id);
  let products = load();
  let editingId = null;

  function load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE) || 'null');
      return Array.isArray(parsed) ? parsed : structuredClone(DEFAULTS);
    } catch (_) {
      return JSON.parse(JSON.stringify(DEFAULTS));
    }
  }

  function save() {
    localStorage.setItem(STORAGE, JSON.stringify(products));
    render();
  }

  function money(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0));
  }

  function esc(v='') {
    return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  }

  function clicksFor(id) {
    try { return JSON.parse(localStorage.getItem('achouOfertaClicks') || '{}')[id] || 0; }
    catch (_) { return 0; }
  }

  function render() {
    $('statProducts').textContent = products.length;
    $('statFeatured').textContent = products.filter(p => p.featured).length;
    $('statClicks').textContent = products.reduce((n,p) => n + clicksFor(p.id), 0);
    $('statCategories').textContent = new Set(products.map(p => p.category).filter(Boolean)).size;

    $('productRows').innerHTML = products.map(p => `
      <tr>
        <td><strong>${esc(p.name)}</strong><small>${p.isDemo ? 'Demonstração' : 'Oferta'}</small></td>
        <td>${esc(p.category)}</td>
        <td>${esc(p.store)}</td>
        <td>${money(p.price)}</td>
        <td>${clicksFor(p.id)}</td>
        <td>${p.featured ? 'Sim' : 'Não'}</td>
        <td class="row-actions">
          <button data-edit="${esc(p.id)}">Editar</button>
          <button class="danger-link" data-delete="${esc(p.id)}">Excluir</button>
        </td>
      </tr>`).join('');
  }

  function openModal(product) {
    editingId = product?.id || null;
    $('modalTitle').textContent = product ? 'Editar produto' : 'Novo produto';
    $('productId').value = product?.id || '';
    $('name').value = product?.name || '';
    $('category').value = product?.category || '';
    $('store').value = product?.store || 'Mercado Livre';
    $('price').value = product?.price ?? '';
    $('oldPrice').value = product?.oldPrice ?? '';
    $('emoji').value = product?.emoji || '🛍️';
    $('featured').value = String(Boolean(product?.featured));
    $('image').value = product?.image || '';
    $('link').value = product?.link || '';
    $('productModal').classList.remove('hidden');
  }

  function closeModal() {
    $('productModal').classList.add('hidden');
    $('productForm').reset();
    editingId = null;
  }

  $('newProductBtn')?.addEventListener('click', () => openModal());
  $('closeModal')?.addEventListener('click', closeModal);
  $('cancelBtn')?.addEventListener('click', closeModal);

  $('productForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const p = {
      id: editingId || `produto-${Date.now()}`,
      name: $('name').value.trim(),
      category: $('category').value.trim(),
      store: $('store').value.trim(),
      price: Number($('price').value),
      oldPrice: $('oldPrice').value ? Number($('oldPrice').value) : null,
      emoji: $('emoji').value.trim() || '🛍️',
      featured: $('featured').value === 'true',
      image: $('image').value.trim(),
      link: $('link').value.trim(),
      isDemo: false,
      createdAt: editingId ? (products.find(x => x.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    };
    if (editingId) products = products.map(x => x.id === editingId ? p : x);
    else products.unshift(p);
    save(); closeModal(); toast('Produto salvo neste navegador. Para publicar, exporte e peça ao Claude Code para atualizar products.js.');
  });

  $('productRows')?.addEventListener('click', (e) => {
    const edit = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-delete]');
    if (edit) openModal(products.find(p => p.id === edit.dataset.edit));
    if (del && confirm('Excluir este produto?')) {
      products = products.filter(p => p.id !== del.dataset.delete); save(); toast('Produto excluído.');
    }
  });

  $('resetBtn')?.addEventListener('click', () => {
    if (!confirm('Restaurar o catálogo publicado, descartando alterações feitas neste navegador?')) return;
    products = JSON.parse(JSON.stringify(DEFAULTS)); save(); toast('Catálogo padrão restaurado.');
  });

  $('exportBtn')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'achou-oferta-produtos.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $('importInput')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed)) throw new Error('Formato inválido');
      products = parsed; save(); toast('Catálogo importado.');
    } catch (_) { alert('Arquivo JSON inválido.'); }
    e.target.value = '';
  });

  function toast(message) {
    const el = $('toast');
    if (!el) return;
    el.textContent = message; el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3500);
  }

  render();
})();
