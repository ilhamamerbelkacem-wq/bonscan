// ===== BASE DE DONNÉES (IndexedDB) =====
const DB_NAME = 'BonScanDB';
const DB_VERSION = 1;
let db = null;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => { db = request.result; resolve(db); };
    request.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('bons')) {
        const store = d.createObjectStore('bons', { keyPath: 'id', autoIncrement: true });
        store.createIndex('supplier', 'supplier', { unique: false });
        store.createIndex('date', 'date', { unique: false });
      }
      if (!d.objectStoreNames.contains('images')) {
        d.createObjectStore('images', { keyPath: 'id' });
      }
    };
  });
}

function saveBonToDB(bon) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['bons'], 'readwrite');
    const store = tx.objectStore('bons');
    const req = store.add(bon);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function updateBonInDB(bon) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['bons'], 'readwrite');
    const store = tx.objectStore('bons');
    const req = store.put(bon);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getAllBons() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['bons'], 'readonly');
    const store = tx.objectStore('bons');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function deleteBonFromDB(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['bons'], 'readwrite');
    const store = tx.objectStore('bons');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function saveImage(id, dataUrl) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['images'], 'readwrite');
    const store = tx.objectStore('images');
    const req = store.put({ id, data: dataUrl });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function getImage(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['images'], 'readonly');
    const store = tx.objectStore('images');
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result ? req.result.data : null);
    req.onerror = () => reject(req.error);
  });
}

// ===== ÉTAT GLOBAL =====
let currentBon = {
  id: null,
  supplier: '',
  date: new Date().toISOString().split('T')[0],
  number: '',
  items: [],
  imageId: null,
  createdAt: null
};
let allBons = [];
let editingExisting = false;

// ===== NAVIGATION =====
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('screen-' + screenId).classList.add('active');
  const navBtn = document.querySelector('.nav-btn[data-screen="' + screenId + '"]');
  if (navBtn) navBtn.classList.add('active');

  if (screenId === 'home') loadHome();
  if (screenId === 'history') renderHistory();
  if (screenId === 'stats') renderStats();
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => showScreen(btn.dataset.screen));
});

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', async () => {
  await initDB();
  document.getElementById('bonDate').value = new Date().toISOString().split('T')[0];
  loadHome();
  updateSupplierSelects();
});

// ===== ACCUEIL =====
async function loadHome() {
  allBons = await getAllBons();
  allBons.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Fournisseurs récents
  const suppliers = [...new Set(allBons.map(b => b.supplier))];
  const recentSup = document.getElementById('recentSuppliers');
  if (suppliers.length === 0) {
    recentSup.innerHTML = '<div style="color:var(--text-tertiary);font-size:13px">Aucun fournisseur encore.</div>';
  } else {
    recentSup.innerHTML = suppliers.slice(0, 6).map(s => {
      const count = allBons.filter(b => b.supplier === s).length;
      return `<div class="supplier-chip" onclick="filterBySupplier('${s}')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <div><div class="name">${escapeHtml(s)}</div><div class="count">${count} bon(s)</div></div>
      </div>`;
    }).join('');
  }

  // Derniers bons
  const recentBons = document.getElementById('recentBons');
  if (allBons.length === 0) {
    recentBons.innerHTML = '<div style="color:var(--text-tertiary);font-size:13px">Aucun bon enregistré. Commencez par scanner un bon !</div>';
  } else {
    recentBons.innerHTML = allBons.slice(0, 5).map(b => {
      const total = b.items.reduce((s, it) => s + (it.qty * it.price), 0);
      return `<div class="bon-item" onclick="openBon(${b.id})">
        <div class="bon-item-left">
          <span class="bon-item-date">${formatDate(b.date)} ${b.number ? '— ' + escapeHtml(b.number) : ''}</span>
          <span class="bon-item-supplier">${escapeHtml(b.supplier)} — ${b.items.length} article(s)</span>
        </div>
        <div class="bon-item-right">
          <div class="bon-item-amount">${total.toFixed(2).replace('.', ',')} €</div>
        </div>
      </div>`;
    }).join('');
  }
}

function filterBySupplier(supplier) {
  document.getElementById('historyFilter').value = supplier;
  showScreen('history');
}

// ===== SCAN / OCR =====
document.getElementById('fileInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    document.getElementById('previewImg').src = evt.target.result;
    document.getElementById('scanPreview').style.display = 'block';
    currentBon.imageData = evt.target.result;
  };
  reader.readAsDataURL(file);
});

async function processOCR() {
  const supplier = getSupplier();
  if (!supplier) { showToast('Veuillez choisir un fournisseur'); return; }
  currentBon.supplier = supplier;
  currentBon.date = document.getElementById('bonDate').value;
  currentBon.number = document.getElementById('bonNumber').value.trim();

  const progress = document.getElementById('ocrProgress');
  const fill = document.getElementById('progressFill');
  const text = document.getElementById('progressText');
  progress.style.display = 'block';

  try {
    const result = await Tesseract.recognize(
      currentBon.imageData,
      'fra',
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            fill.style.width = (m.progress * 100) + '%';
            text.textContent = `Reconnaissance... ${Math.round(m.progress * 100)}%`;
          } else {
            text.textContent = m.status;
          }
        }
      }
    );

    // Parser le texte OCR pour extraire un tableau
    const lines = result.data.text.split('\n').filter(l => l.trim());
    const items = parseOCRLines(lines);

    if (items.length === 0) {
      showToast('Aucun produit détecté. Vous pouvez saisir manuellement.');
      createManualBon();
    } else {
      currentBon.items = items;
      editingExisting = false;
      openEditor();
    }
  } catch (err) {
    showToast('Erreur OCR : ' + err.message);
    createManualBon();
  } finally {
    progress.style.display = 'none';
    fill.style.width = '0%';
  }
}

function parseOCRLines(lines) {
  const items = [];
  // Regex simple pour détecter des lignes avec prix
  const priceRegex = /(\d+[.,]?\d*)\s*(€|EUR|euro)?/i;
  const qtyRegex = /(\d+)\s*(sac|m³|m3|pot|bidon|barre|pièce|pc|kg|tonne|ml|L|lot|carton)/i;

  for (const line of lines) {
    const priceMatch = line.match(priceRegex);
    const qtyMatch = line.match(qtyRegex);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(',', '.'));
      const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;
      const unit = qtyMatch ? qtyMatch[2] : 'unité';
      // Extraire le nom (tout sauf prix et qté)
      let name = line
        .replace(priceMatch[0], '')
        .replace(qtyMatch ? qtyMatch[0] : '', '')
        .replace(/[^\w\s\-]/g, ' ')
        .trim();
      if (name.length < 2) name = 'Produit';
      items.push({
        ref: '',
        name: name.substring(0, 50),
        qty: qty,
        unit: unit,
        price: price
      });
    }
  }
  return items;
}

// ===== MANUEL =====
function createManualBon() {
  const supplier = getSupplier();
  if (!supplier) { showToast('Veuillez choisir un fournisseur'); return; }
  currentBon.supplier = supplier;
  currentBon.date = document.getElementById('bonDate').value;
  currentBon.number = document.getElementById('bonNumber').value.trim();
  currentBon.items = [
    { ref: '', name: '', qty: 1, unit: '', price: 0 },
    { ref: '', name: '', qty: 1, unit: '', price: 0 },
    { ref: '', name: '', qty: 1, unit: '', price: 0 }
  ];
  editingExisting = false;
  openEditor();
}

function getSupplier() {
  const sel = document.getElementById('supplierSelect');
  if (sel.value === '__new__') return document.getElementById('newSupplierInput').value.trim();
  return sel.value;
}

function toggleNewSupplier() {
  const sel = document.getElementById('supplierSelect');
  const input = document.getElementById('newSupplierInput');
  if (sel.value === '__new__') {
    sel.value = '';
    input.style.display = 'none';
  } else {
    sel.value = '__new__';
    input.style.display = 'block';
    input.focus();
  }
}

// ===== ÉDITEUR =====
function openEditor() {
  document.getElementById('editTitle').textContent = editingExisting ? 'Modifier le bon' : 'Nouveau bon de commande';
  document.getElementById('editMeta').innerHTML = `
    <span>${escapeHtml(currentBon.supplier)}</span> &bull;
    <span>${formatDate(currentBon.date)}</span>
    ${currentBon.number ? '&bull; <span>' + escapeHtml(currentBon.number) + '</span>' : ''}
  `;
  renderEditorTable();
  showScreen('edit');
}

function renderEditorTable() {
  const tbody = document.getElementById('productsBody');
  tbody.innerHTML = '';
  let grandTotal = 0;
  const alerts = [];

  currentBon.items.forEach((item, idx) => {
    const lastPrice = getLastPriceForProduct(currentBon.supplier, item.name, item.ref);
    let priceClass = 'price-same';
    let priceHint = '';

    if (lastPrice !== null && item.price > 0) {
      const diff = item.price - lastPrice;
      if (Math.abs(diff) > 0.001) {
        if (diff > 0) {
          priceClass = 'price-up';
          priceHint = '▲ +' + diff.toFixed(2) + ' € (avant: ' + lastPrice.toFixed(2) + ')';
          alerts.push({ name: item.name || item.ref || 'Article ' + (idx+1), old: lastPrice, new: item.price, up: true });
        } else {
          priceClass = 'price-down';
          priceHint = '▼ ' + diff.toFixed(2) + ' € (avant: ' + lastPrice.toFixed(2) + ')';
          alerts.push({ name: item.name || item.ref || 'Article ' + (idx+1), old: lastPrice, new: item.price, up: false });
        }
      } else {
        priceHint = '= même prix (' + lastPrice.toFixed(2) + ' €)';
      }
    } else if (lastPrice === null && item.price > 0) {
      priceHint = '— premier prix';
    }

    const lineTotal = item.qty * item.price;
    grandTotal += lineTotal;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="row-num">${idx + 1}</td>
      <td><input value="${escapeHtml(item.ref)}" onchange="updateItem(${idx}, 'ref', this.value)" placeholder="REF"></td>
      <td><input value="${escapeHtml(item.name)}" onchange="updateItem(${idx}, 'name', this.value)" placeholder="Nom du produit"></td>
      <td><input type="number" min="0" step="any" value="${item.qty}" onchange="updateItem(${idx}, 'qty', parseFloat(this.value)||0)" style="text-align:center"></td>
      <td><input value="${escapeHtml(item.unit)}" onchange="updateItem(${idx}, 'unit', this.value)" placeholder="unité" style="text-align:center"></td>
      <td>
        <input type="number" min="0" step="0.01" value="${item.price > 0 ? item.price.toFixed(2) : ''}" onchange="updateItem(${idx}, 'price', parseFloat(this.value)||0)" style="text-align:right">
        ${priceHint ? `<div class="price-hint ${priceClass}">${priceHint}</div>` : ''}
      </td>
      <td class="font-mono" style="text-align:right;font-weight:500">${lineTotal.toFixed(2).replace('.', ',')}</td>
      <td class="row-actions">
        <button class="btn-delete" onclick="removeItem(${idx})" title="Supprimer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('grandTotal').textContent = grandTotal.toFixed(2).replace('.', ',') + ' €';

  // Render alerts
  const alertBox = document.getElementById('priceAlerts');
  if (alerts.length > 0) {
    alertBox.style.display = 'flex';
    alertBox.innerHTML = alerts.map(a => {
      const cls = a.up ? 'up' : 'down';
      const icon = a.up
        ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>'
        : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>';
      return `<span class="alert-tag ${cls}">${icon} ${escapeHtml(a.name)} : ${a.old.toFixed(2)} → ${a.new.toFixed(2)} €</span>`;
    }).join('');
  } else {
    alertBox.style.display = 'none';
    alertBox.innerHTML = '';
  }
}

function getLastPriceForProduct(supplier, name, ref) {
  // Chercher dans les bons existants du même fournisseur
  const supplierBons = allBons.filter(b => b.supplier === supplier);
  supplierBons.sort((a, b) => new Date(b.date) - new Date(a.date));

  for (const bon of supplierBons) {
    if (editingExisting && bon.id === currentBon.id) continue; // Skip current bon when editing
    for (const item of bon.items) {
      if (ref && item.ref === ref) return item.price;
      if (name && item.name && item.name.toLowerCase() === name.toLowerCase()) return item.price;
    }
  }
  return null;
}

function updateItem(idx, field, value) {
  currentBon.items[idx][field] = value;
  renderEditorTable();
}

function addProductRow() {
  currentBon.items.push({ ref: '', name: '', qty: 1, unit: '', price: 0 });
  renderEditorTable();
}

function removeItem(idx) {
  currentBon.items.splice(idx, 1);
  renderEditorTable();
}

async function saveBon() {
  if (currentBon.items.length === 0) { showToast('Le bon est vide'); return; }
  if (!currentBon.supplier) { showToast('Fournisseur manquant'); return; }

  // Filtrer les lignes vides
  currentBon.items = currentBon.items.filter(it => it.name.trim() || it.ref.trim() || it.price > 0);
  if (currentBon.items.length === 0) { showToast('Le bon est vide'); return; }

  currentBon.updatedAt = new Date().toISOString();

  if (editingExisting && currentBon.id) {
    await updateBonInDB(currentBon);
    showToast('Bon modifié avec succès !');
  } else {
    currentBon.createdAt = new Date().toISOString();
    if (currentBon.imageData) {
      currentBon.imageId = 'img_' + Date.now();
      await saveImage(currentBon.imageId, currentBon.imageData);
    }
    await saveBonToDB(currentBon);
    showToast('Bon enregistré avec succès !');
  }

  allBons = await getAllBons();
  updateSupplierSelects();
  showScreen('home');
}

async function openBon(id) {
  const bon = allBons.find(b => b.id === id);
  if (!bon) return;
  currentBon = JSON.parse(JSON.stringify(bon));
  editingExisting = true;
  openEditor();
}

// ===== HISTORIQUE =====
async function renderHistory() {
  allBons = await getAllBons();
  allBons.sort((a, b) => new Date(b.date) - new Date(a.date));

  const filter = document.getElementById('historyFilter').value;
  const search = document.getElementById('historySearch').value.toLowerCase();

  let filtered = allBons;
  if (filter) filtered = filtered.filter(b => b.supplier === filter);
  if (search) filtered = filtered.filter(b =>
    b.supplier.toLowerCase().includes(search) ||
    (b.number && b.number.toLowerCase().includes(search)) ||
    b.items.some(it => (it.name || '').toLowerCase().includes(search) || (it.ref || '').toLowerCase().includes(search))
  );

  const container = document.getElementById('historyContent');
  if (filtered.length === 0) {
    container.innerHTML = '<div style="color:var(--text-tertiary);text-align:center;padding:40px">Aucun bon trouvé.</div>';
    return;
  }

  // Grouper par fournisseur
  const bySupplier = {};
  filtered.forEach(b => {
    if (!bySupplier[b.supplier]) bySupplier[b.supplier] = [];
    bySupplier[b.supplier].push(b);
  });

  container.innerHTML = Object.entries(bySupplier).map(([sup, bons]) => {
    return `<div class="history-group">
      <div class="history-group-title">${escapeHtml(sup)}</div>
      <div class="bons-list">
        ${bons.map(b => {
          const total = b.items.reduce((s, it) => s + (it.qty * it.price), 0);
          return `<div class="bon-item" onclick="openBon(${b.id})">
            <div class="bon-item-left">
              <span class="bon-item-date">${formatDate(b.date)} ${b.number ? '— ' + escapeHtml(b.number) : ''}</span>
              <span class="bon-item-supplier">${b.items.length} article(s)</span>
            </div>
            <div class="bon-item-right">
              <div class="bon-item-amount">${total.toFixed(2).replace('.', ',')} €</div>
              <button class="btn-delete" onclick="event.stopPropagation();deleteBon(${b.id})" title="Supprimer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');
}

async function deleteBon(id) {
  if (!confirm('Supprimer ce bon définitivement ?')) return;
  await deleteBonFromDB(id);
  allBons = await getAllBons();
  renderHistory();
  updateSupplierSelects();
  showToast('Bon supprimé');
}

// ===== STATS =====
async function renderStats() {
  allBons = await getAllBons();
  const suppliers = [...new Set(allBons.map(b => b.supplier))];
  const totalAmount = allBons.reduce((s, b) => s + b.items.reduce((ss, it) => ss + it.qty * it.price, 0), 0);

  // Compter les variations
  let changes = 0;
  const productHistory = {};
  allBons.forEach(b => {
    b.items.forEach(it => {
      const key = (it.ref || it.name || '').toLowerCase();
      if (!key) return;
      if (!productHistory[key]) productHistory[key] = [];
      productHistory[key].push({ date: b.date, price: it.price, supplier: b.supplier });
    });
  });
  Object.values(productHistory).forEach(history => {
    history.sort((a, b) => new Date(a.date) - new Date(b.date));
    for (let i = 1; i < history.length; i++) {
      if (Math.abs(history[i].price - history[i-1].price) > 0.001) changes++;
    }
  });

  document.getElementById('statTotalBons').textContent = allBons.length;
  document.getElementById('statTotalSuppliers').textContent = suppliers.length;
  document.getElementById('statTotalAmount').textContent = totalAmount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €';
  document.getElementById('statPriceChanges').textContent = changes;

  // Évolution des prix
  const evoContainer = document.getElementById('priceEvolution');
  const productsWithHistory = Object.entries(productHistory)
    .filter(([k, h]) => h.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);

  if (productsWithHistory.length === 0) {
    evoContainer.innerHTML = '<div style="color:var(--text-tertiary);text-align:center;padding:20px">Pas assez d'historique pour afficher l'évolution.</div>';
    return;
  }

  evoContainer.innerHTML = productsWithHistory.map(([key, history]) => {
    const minP = Math.min(...history.map(h => h.price));
    const maxP = Math.max(...history.map(h => h.price));
    const range = maxP - minP || 1;
    const title = history[0].ref || history[0].name || key;
    return `<div class="evolution-item">
      <div class="evolution-item-title">${escapeHtml(title)} <span style="color:var(--text-tertiary);font-weight:400">— ${history[0].supplier}</span></div>
      ${history.map(h => {
        const pct = ((h.price - minP) / range) * 100;
        return `<div class="evolution-bar">
          <span class="evolution-date">${formatDate(h.date)}</span>
          <div class="evolution-track"><div class="evolution-dot" style="left:${pct}%"></div></div>
          <span class="evolution-price">${h.price.toFixed(2)}€</span>
        </div>`;
      }).join('')}
    </div>`;
  }).join('');
}

// ===== UTILITAIRES =====
function updateSupplierSelects() {
  const suppliers = [...new Set(allBons.map(b => b.supplier))].sort();
  ['supplierSelect', 'historyFilter'].forEach(id => {
    const sel = document.getElementById(id);
    const currentVal = sel.value;
    let html = id === 'supplierSelect'
      ? '<option value="">-- Choisir un fournisseur --</option>'
      : '<option value="">Tous les fournisseurs</option>';
    suppliers.forEach(s => {
      html += `<option value="${escapeHtml(s)}" ${currentVal === s ? 'selected' : ''}>${escapeHtml(s)}</option>`;
    });
    if (id === 'supplierSelect') html += '<option value="__new__">+ Nouveau fournisseur</option>';
    sel.innerHTML = html;
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== SERVICE WORKER =====
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
