// ===============================
// NAVICOM — js.js
// Cubre: Productos, Cesta, Checkout, PagoConfirmado, Auth Firebase
// ===============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDaK9BDfnaiogPekyuKFKeaQiiuv77DON8",
  authDomain: "navicom-prototipo.firebaseapp.com",
  projectId: "navicom-prototipo",
  storageBucket: "navicom-prototipo.firebasestorage.app",
  messagingSenderId: "220981985959",
  appId: "1:220981985959:web:caef2dc2d6740e234f1182",
  measurementId: "G-0TWZD9P14K"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ── Flag de logout ─────────────────────────────────────
const isLoggingOut = () => sessionStorage.getItem('navicom-logout') === 'true';

// ── Escuchar cambios de sesión en tiempo real ──────────
onAuthStateChanged(auth, async (user) => {
  if (isLoggingOut()) {
    sessionStorage.removeItem('navicom-logout');
    localStorage.removeItem('navicom-user');
    if (user) {
      try { await signOut(auth); } catch(e) {}
    }
    updateAuthUI();
    return;
  }

  if (user) {
    const nombre = user.displayName || user.email.split('@')[0];
    localStorage.setItem('navicom-user', JSON.stringify({ nombre, email: user.email }));
  } else {
    localStorage.removeItem('navicom-user');
  }
  updateAuthUI();
});

// ── Estado de la cesta (persistente) ──────────────────
let cart = JSON.parse(localStorage.getItem('navicom-cart')) || [];

// ── Actualizar contador del navbar ─────────────────────
function updateCartCounter() {
  document.querySelectorAll('#cart-count').forEach(el => {
    el.textContent = cart.reduce((acc, item) => acc + item.quantity, 0);
  });
}

// ── Guardar carrito ────────────────────────────────────
function saveCart() {
  localStorage.setItem('navicom-cart', JSON.stringify(cart));
  updateCartCounter();
}

// ── Eliminar item de cesta ─────────────────────────────
window.removeItem = function(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCartPage();
};

// ── Función cesta ──────────────────────────────────────
function renderCartPage() {
  window.cestaQty = (id, change) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.quantity += change;
    if (item.quantity <= 0) {
      cart = cart.filter(i => i.id !== id);
    }
    saveCart();
    renderCartPage();
  };

  const container  = document.getElementById('cart-items-container');
  const subtotalEl = document.getElementById('summary-subtotal');
  const totalEl    = document.getElementById('summary-total');
  const ivaEl      = document.getElementById('summary-iva');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cesta-empty">
        <div class="cesta-empty-icon">
          <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        </div>
        <h3>Tu cesta está vacía</h3>
        <p>Añade productos para poder finalizar tu compra.</p>
        <a href="Productos.html" class="cesta-empty-btn">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          Explorar productos
        </a>
      </div>`;
    if (subtotalEl) subtotalEl.textContent = '0,00 €';
    if (totalEl)    totalEl.textContent    = '0,00 €';
    if (ivaEl)      ivaEl.textContent      = '0,00 €';
    return;
  }

  const fmt = n => n.toLocaleString('es-ES', { minimumFractionDigits: 2 }) + ' €';

  container.innerHTML = cart.map(item => `
    <div class="cesta-item">
      <div class="cesta-item-info">
        <div class="cesta-item-thumb">
          ${item.image
            ? `<img src="${item.image}" alt="${item.name}">`
            : `<span class="cesta-item-thumb-placeholder">${item.name.slice(0,6).toUpperCase()}</span>`}
        </div>
        <div>
          <div class="cesta-item-name">${item.name}</div>
          <div class="cesta-item-unit">${fmt(item.price)} / ud.</div>
        </div>
      </div>
      <div class="cesta-qty-controls">
        <button class="cesta-qty-btn minus-btn" onclick="cestaQty(${item.id}, -1)">−</button>
        <span class="cesta-qty-num" id="cesta-qty-${item.id}">${item.quantity}</span>
        <button class="cesta-qty-btn" onclick="cestaQty(${item.id}, 1)">+</button>
      </div>
      <div class="cesta-item-price-col">
        <span class="cesta-item-price" id="cesta-price-${item.id}">${fmt(item.price * item.quantity)}</span>
        <button class="cesta-remove-btn" onclick="window.removeItem(${item.id})">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          Eliminar
        </button>
      </div>
    </div>`).join('');

  const subtotal = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const iva = subtotal * 0.21;

  if (subtotalEl) subtotalEl.textContent = fmt(subtotal);
  if (ivaEl)      ivaEl.textContent      = fmt(iva);
  if (totalEl)    totalEl.textContent    = fmt(subtotal);
}

// ── Checkout ───────────────────────────────────────────
function initCheckout() {
  const listEl     = document.getElementById('co-items-list');
  const subtotalEl = document.getElementById('co-subtotal');
  const totalEl    = document.getElementById('co-total');
  const ivaEl      = document.getElementById('co-iva');
  const checkCart  = JSON.parse(localStorage.getItem('navicom-cart')) || [];

  if (!listEl) return;

  const fmt = n => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

  if (checkCart.length === 0) {
    listEl.innerHTML = '<p style="color:var(--gray-400);font-size:13px;">No hay productos en tu cesta.</p>';
    if (subtotalEl) subtotalEl.textContent = fmt(0);
    if (totalEl)    totalEl.textContent    = fmt(0);
    if (ivaEl)      ivaEl.textContent      = fmt(0);
    return;
  }

  listEl.innerHTML = checkCart.map(item => `
    <div class="co-item-row">
      <div class="co-item-thumb">
        ${item.image
          ? `<img src="${item.image}" alt="${item.name}">`
          : item.name.slice(0, 6).toUpperCase()}
      </div>
      <div class="co-item-info">
        <div class="co-item-name">${item.name}</div>
        <div class="co-item-qty">${item.quantity} ud. × ${fmt(item.price)}</div>
      </div>
      <span class="co-item-price">${fmt(item.price * item.quantity)}</span>
    </div>`).join('');

  const subtotal = checkCart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const iva = subtotal * 0.21;

  if (subtotalEl) subtotalEl.textContent = fmt(subtotal);
  if (ivaEl)      ivaEl.textContent      = fmt(iva);
  if (totalEl)    totalEl.textContent    = fmt(subtotal);
}

window.handleCheckoutPay = function() {
  localStorage.removeItem('navicom-cart');
  updateCartCounter();
};

// ── Selección de método de pago ────────────────────────
window.selectPayment = function(element) {
  document.querySelectorAll('.method-card').forEach(c => c.classList.remove('active'));
  element.classList.add('active');
};

// ── Actualizar navbar según estado de login ────────────
function updateAuthUI() {
  const authLink = document.querySelector('.nav-account');
  if (!authLink) return;

  const currentUser = JSON.parse(localStorage.getItem('navicom-user'));

  if (currentUser) {
    authLink.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
      ${currentUser.nombre}
    `;
    authLink.href = "./MiCuenta.html";
  } else {
    authLink.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
      Iniciar sesión
    `;
    authLink.href = "./iniciarSesion.html";
  }
}

// ── LOGIN con email/contraseña ─────────────────────────
window.handleLogin = async function() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;

  if (!email || !pass) {
    alert('Por favor, introduce correo y contraseña.');
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    alert('¡Bienvenido de nuevo!');
    setTimeout(() => window.location.href = "./Incio.html", 800);
  } catch (err) {
    alert('Correo o contraseña incorrectos.');
    console.error(err);
  }
};

// ── REGISTRO con email/contraseña ─────────────────────
window.handleRegister = async function() {
  const nombre   = document.getElementById('reg-nombre').value.trim();
  const apellido = document.getElementById('reg-apellido').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const pass     = document.getElementById('reg-pass').value;
  const terms    = document.getElementById('reg-terms').checked;

  if (!nombre || !email || !pass) {
    alert('Por favor, completa nombre, email y contraseña.');
    return;
  }
  if (!terms) {
    alert('Debes aceptar los términos y condiciones.');
    return;
  }
  if (pass.length < 6) {
    alert('La contraseña debe tener al menos 6 caracteres.');
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, pass);
    const nombreCompleto = nombre + (apellido ? ' ' + apellido : '');
    localStorage.setItem('navicom-user', JSON.stringify({ nombre: nombreCompleto, email }));
    alert(`¡Cuenta creada! Bienvenido, ${nombreCompleto}`);
    setTimeout(() => window.location.href = "./Incio.html", 800);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      alert('Ya existe una cuenta con ese correo electrónico.');
    } else {
      alert('Error al crear la cuenta. Inténtalo de nuevo.');
    }
    console.error(err);
  }
};

// ── LOGIN con Google ───────────────────────────────────
window.handleGoogleLogin = async function() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user   = result.user;
    const nombre = user.displayName || user.email.split('@')[0];
    localStorage.setItem('navicom-user', JSON.stringify({ nombre, email: user.email }));
    alert(`¡Conectado como ${nombre}!`);
    updateAuthUI();
    setTimeout(() => window.location.href = "./Incio.html", 700);
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') {
      alert('Error al conectar con Google. Inténtalo de nuevo.');
    }
    console.error(err);
  }
};

// ── LOGIN con Microsoft (simulado) ────────────────────
window.handleMicrosoftLogin = function() {
  const fakeNames = ["María López", "Javier Ruiz", "Sofía Ramírez", "Pablo Navarro"];
  const randomName = fakeNames[Math.floor(Math.random() * fakeNames.length)];
  localStorage.setItem('navicom-user', JSON.stringify({
    nombre: randomName,
    email: randomName.toLowerCase().replace(' ', '.') + "@outlook.com"
  }));
  alert(`¡Conectado con Microsoft como ${randomName}!`);
  updateAuthUI();
  setTimeout(() => window.location.href = "./Incio.html", 700);
};

// ── Cerrar sesión ──────────────────────────────────────
window.handleLogout = async function() {
  localStorage.removeItem('navicom-user');
  sessionStorage.setItem('navicom-logout', 'true');
  try { await signOut(auth); } catch(e) {}
  updateAuthUI();
  window.location.href = "./Incio.html";
};

// ── Cambiar entre pestañas login/registro ──────────────
window.switchTab = function(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('panel-login').classList.toggle('active', tab === 'login');
  document.getElementById('panel-register').classList.toggle('active', tab === 'register');
};

// ══════════════════════════════════════════════════════
// DOMContentLoaded — todo lo que necesita el DOM listo
// ══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

  updateCartCounter();
  renderCartPage();

  // Checkout
  if (document.querySelector('.checkout-page')) {
    initCheckout();
  }

  // Botones OAuth
  document.querySelectorAll('.cf-oauth-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const text = this.textContent.trim().toLowerCase();
      if (text.includes('google')) {
        handleGoogleLogin();
      } else if (text.includes('microsoft')) {
        handleMicrosoftLogin();
      }
    });
  });

  // Hamburger
  const ham = document.getElementById('hamburger');
  const navL = document.getElementById('nav-links');
  if (ham && navL) {
    ham.addEventListener('click', () => {
      ham.classList.toggle('open');
      navL.style.display = navL.style.display === 'flex' ? 'none' : 'flex';
    });
  }

  // Cookie Banner
  (function() {
    const COOKIE_KEY = 'navicom-cookies-accepted';
    if (localStorage.getItem(COOKIE_KEY)) return;
    const overlay = document.getElementById('cookie-overlay');
    if (!overlay) return;

    document.body.classList.add('cookies-pending');
    overlay.classList.add('active');

    function hideBanner(accepted) {
      const banner = overlay.querySelector('.cookie-banner');
      banner.classList.add('hiding');
      document.body.classList.remove('cookies-pending');
      document.querySelectorAll('header, section, footer').forEach(el => {
        el.style.filter = 'none';
        el.style.pointerEvents = '';
        el.style.userSelect = '';
      });
      setTimeout(() => {
        overlay.classList.remove('active');
        overlay.style.display = 'none';
      }, 350);
      localStorage.setItem(COOKIE_KEY, accepted ? 'all' : 'essential');
    }

    const acceptBtn = document.getElementById('cookie-accept');
    const rejectBtn = document.getElementById('cookie-reject');
    if (acceptBtn) acceptBtn.addEventListener('click', () => hideBanner(true));
    if (rejectBtn) rejectBtn.addEventListener('click', () => hideBanner(false));
  })();

  // Reveal on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal-up').forEach(el => observer.observe(el));

  // ── Página de Productos — filtros y búsqueda ─────────
  const prodCats = ['hardware','software','perifericos','servidores'];
  const prodList = [
    { id: 1,  name: "Portátil Pro X1",        desc: "Intel Core i7 · 16 GB RAM · 512 GB SSD · 15.6\" FHD 144Hz",  price: 1249.00, cat: "hardware",    badge: "badge-hw",  badgeLabel: "Hardware" },
    { id: 2,  name: "PC Gamer Ultra",          desc: "AMD Ryzen 7 7700X · 32 GB RAM · RTX 4070 Ti · 1 TB NVMe",   price: 2199.00, cat: "hardware",    badge: "badge-hw",  badgeLabel: "Hardware" },
    { id: 9,  name: "MacBook Pro M3",          desc: "Apple M3 Pro · 18 GB RAM unificada · 512 GB SSD · 14\"",     price: 2099.00, cat: "hardware",    badge: "badge-hw",  badgeLabel: "Hardware" },
    { id: 7,  name: "Licencia Windows 11 Pro", desc: "Licencia original OEM para 1 dispositivo, activación digital",price: 249.00, cat: "software",    badge: "badge-sw",  badgeLabel: "Software" },
    { id: 8,  name: "Bitdefender GravityZone", desc: "Protección empresarial · 25 usuarios · 1 año de soporte",   price:  399.00, cat: "software",    badge: "badge-sw",  badgeLabel: "Software" },
    { id: 3,  name: "Monitor 27\" 4K IPS",     desc: "3840×2160 · 144 Hz · HDR400 · USB-C PD 90W",               price:  479.00, cat: "perifericos", badge: "badge-per", badgeLabel: "Periférico" },
    { id: 5,  name: "Teclado Mecánico RGB",    desc: "Switches Brown · Aluminio · Inalámbrico 2.4G/BT",           price:   89.00, cat: "perifericos", badge: "badge-per", badgeLabel: "Periférico" },
    { id: 6,  name: "Ratón Inalámbrico Pro",   desc: "12 000 DPI · Sensor PMW3395 · 90 días de batería",          price:   69.00, cat: "perifericos", badge: "badge-per", badgeLabel: "Periférico" },
    { id: 4,  name: "Servidor NAS 4 Bahías",   desc: "Intel Xeon · 16 GB ECC RAM · RAID 0/1/5/6/10",             price:  949.00, cat: "servidores",  badge: "badge-ser", badgeLabel: "Servidor" },
  ];

  let currentFilter = 'todos';
  let searchTerm = '';

  function cardHTML(p) {
    const inCart = cart.find(i => i.id === p.id);
    const qty = inCart ? inCart.quantity : 0;
    return `
      <div class="p-card" id="pcard-${p.id}">
        <div class="p-card-img">
          <span class="p-card-badge ${p.badge}">${p.badgeLabel}</span>
          <span class="p-placeholder">${p.name.toUpperCase()}</span>
        </div>
        <div class="p-card-body">
          <h3 class="p-card-name">${p.name}</h3>
          <p class="p-card-desc">${p.desc}</p>
          <div class="p-card-footer">
            <span class="p-card-price">${p.price.toLocaleString('es-ES', {minimumFractionDigits:2})} <small>€</small></span>
            <div class="p-card-actions">
              <button class="btn-add-p" id="addbtn-${p.id}" ${qty>0?'style="display:none;"':''} onclick="handleAdd(${p.id})">Añadir</button>
              <div class="qty-row-p ${qty>0?'visible':''}" id="qtyrow-${p.id}">
                <button class="qty-sm" onclick="handleMinus(${p.id})">−</button>
                <span class="qty-num-p" id="qty-${p.id}">${qty}</span>
                <button class="qty-sm" onclick="handlePlus(${p.id})">+</button>
                <button class="qty-ok" onclick="handleOk(${p.id})">OK</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function showToast(name) {
    const t = document.getElementById('toast');
    if (!t) return;
    document.getElementById('toast-msg').textContent = `"${name}" añadido a la cesta`;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2600);
  }

  window.handleAdd = id => {
    const p = prodList.find(x => x.id === id);
    if (!p) return;
    const ex = cart.find(i => i.id === id);
    if (ex) ex.quantity++; else cart.push({...p, quantity:1});
    saveCart();
    const addBtn = document.getElementById('addbtn-'+id);
    const qtyRow = document.getElementById('qtyrow-'+id);
    const qtyNum = document.getElementById('qty-'+id);
    if (addBtn) addBtn.style.display = 'none';
    if (qtyRow) qtyRow.classList.add('visible');
    if (qtyNum) qtyNum.textContent = cart.find(i=>i.id===id).quantity;
    showToast(p.name);
  };

  window.handlePlus = id => {
    const p = prodList.find(x => x.id === id);
    const ex = cart.find(i=>i.id===id);
    if (ex) ex.quantity++;
    else if (p) cart.push({...p, quantity:1});
    saveCart();
    const qtyNum = document.getElementById('qty-'+id);
    if (qtyNum) qtyNum.textContent = cart.find(i=>i.id===id)?.quantity || 0;
  };

  window.handleMinus = id => {
    const ex = cart.find(i=>i.id===id);
    if (!ex) return;
    ex.quantity--;
    if (ex.quantity <= 0) {
      cart = cart.filter(i=>i.id!==id);
      saveCart();
      const qtyRow = document.getElementById('qtyrow-'+id);
      const addBtn = document.getElementById('addbtn-'+id);
      if (qtyRow) qtyRow.classList.remove('visible');
      if (addBtn) addBtn.style.display = '';
    } else {
      saveCart();
      const qtyNum = document.getElementById('qty-'+id);
      if (qtyNum) qtyNum.textContent = ex.quantity;
    }
  };

  window.handleOk = id => {
    const qtyRow = document.getElementById('qtyrow-'+id);
    const addBtn = document.getElementById('addbtn-'+id);
    if (qtyRow) qtyRow.classList.remove('visible');
    if (addBtn) addBtn.style.display = '';
  };

  function applyFilter() {
    const filtered = prodList.filter(p => {
      const mc = currentFilter === 'todos' || p.cat === currentFilter;
      const ms = !searchTerm || p.name.toLowerCase().includes(searchTerm) || p.desc.toLowerCase().includes(searchTerm);
      return mc && ms;
    });

    prodCats.forEach(c => {
      const g = document.getElementById('grid-'+c);
      const sec = document.getElementById('cat-'+c);
      if (!g || !sec) return;
      const items = filtered.filter(p => p.cat === c);
      g.innerHTML = items.map(cardHTML).join('');
      sec.style.display = (currentFilter === 'todos' || currentFilter === c) && items.length ? 'block' : 'none';
    });

    const empty = document.getElementById('empty-state');
    if (empty) empty.classList.toggle('visible', filtered.length === 0);
  }

  if (document.querySelector('.filter-tab')) {
    applyFilter();
    document.querySelectorAll('.filter-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        applyFilter();
      });
    });
    const inp = document.getElementById('search-input');
    if (inp) inp.addEventListener('input', function() {
      searchTerm = this.value.toLowerCase().trim();
      applyFilter();
    });
  }

  // ── Índice de cookies activo al hacer scroll ─────────
  // Envuelto en comprobación para que no rompa en otras páginas
  const cookieSections = document.querySelectorAll('.cookies-section');
  const cookieLinks    = document.querySelectorAll('.cookies-index-link');
  if (cookieSections.length && cookieLinks.length) {
    window.addEventListener('scroll', () => {
      let current = '';
      cookieSections.forEach(s => {
        if (window.scrollY >= s.offsetTop - 120) current = s.id;
      });
      cookieLinks.forEach(l => {
        l.classList.toggle('active', l.getAttribute('href') === '#' + current);
      });
    });
  }

});
