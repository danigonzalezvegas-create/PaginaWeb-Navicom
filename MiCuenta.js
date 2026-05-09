// ══ NAVEGACIÓN DE PANELES ══════════════════════════════
document.querySelectorAll('.mc-navbtn[data-panel]').forEach(btn => {
  btn.addEventListener('click', () => {
    // Quitar activo de todos los botones
    document.querySelectorAll('.mc-navbtn').forEach(b => b.classList.remove('active'));
    // Ocultar todos los paneles
    document.querySelectorAll('.mc-panel').forEach(p => p.classList.remove('active'));
    // Activar botón y panel seleccionado
    btn.classList.add('active');
    document.getElementById('panel-' + btn.dataset.panel)?.classList.add('active');
  });
});

// ══ CARGAR DATOS DEL USUARIO EN EL HERO ══════════════
const user = JSON.parse(localStorage.getItem('navicom-user'));
if (user) {
  const nameEl = document.getElementById('mc-hero-name');
  if (nameEl) nameEl.textContent = 'Bienvenido, ' + user.nombre;
  const perfNombre = document.getElementById('perfil-nombre');
  const perfEmail  = document.getElementById('perfil-email');
  if (perfNombre) perfNombre.value = user.nombre;
  if (perfEmail)  perfEmail.value  = user.email || '';
}

// ══ PEDIDOS — leer del localStorage ══════════════════
function renderPedidos() {
  const container = document.getElementById('pedidos-container');
  const badge = document.getElementById('badge-pedidos');
  const pedidos = JSON.parse(localStorage.getItem('navicom-pedidos')) || [];

  if (badge) badge.textContent = pedidos.length;

  if (!container) return;

  if (pedidos.length === 0) {
    container.innerHTML = `
      <div class="mc-pedido-empty">
        <div class="mc-pedido-empty-icon">
          <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>
        <h3>Aún no tienes pedidos</h3>
        <p>Cuando realices una compra, aparecerá aquí.</p>
        <a href="./Productos.html" class="mc-btn-primary" style="text-decoration:none;display:inline-block;margin-top:8px;">
          Ver productos
        </a>
      </div>`;
    return;
  }

  container.innerHTML = pedidos.map(p => `
    <div class="mc-pedido-card">
      <div class="mc-pedido-top">
        <div>
          <div class="mc-pedido-id">#${p.id}</div>
          <div class="mc-pedido-date">${p.fecha}</div>
        </div>
        <span class="mc-pedido-status mc-status-${p.estado}">${p.estado}</span>
      </div>
      <div class="mc-pedido-items">
        ${p.items.map(i => `
          <div class="mc-pedido-item-row">
            <span>${i.quantity}× ${i.name}</span>
            <span>${(i.price * i.quantity).toLocaleString('es-ES', {minimumFractionDigits:2})} €</span>
          </div>`).join('')}
      </div>
      <div class="mc-pedido-total">
        <span>Total</span>
        <span>${p.total.toLocaleString('es-ES', {minimumFractionDigits:2})} €</span>
      </div>
    </div>`).join('');
}
renderPedidos();

// ══ DIRECCIONES ═══════════════════════════════════════
function renderDirecciones() {
  const lista = document.getElementById('direcciones-lista');
  const statEl = document.getElementById('stat-direcciones');
  const dirs = JSON.parse(localStorage.getItem('navicom-direcciones')) || [];

  if (statEl) statEl.textContent = dirs.length;
  if (!lista) return;

  lista.innerHTML = dirs.length === 0
    ? '<p style="color:#9ca3af;font-size:14px;margin-bottom:16px;">No tienes direcciones guardadas.</p>'
    : dirs.map((d, i) => `
        <div class="mc-dir-card">
          <div class="mc-dir-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div class="mc-dir-info">
            <div class="mc-dir-nombre">${d.nombre}</div>
            <div class="mc-dir-texto">${d.calle}, ${d.ciudad} ${d.cp} — ${d.pais}</div>
          </div>
          <button class="mc-dir-delete" onclick="eliminarDir(${i})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
          </button>
        </div>`).join('');
}
renderDirecciones();

window.eliminarDir = i => {
  const dirs = JSON.parse(localStorage.getItem('navicom-direcciones')) || [];
  dirs.splice(i, 1);
  localStorage.setItem('navicom-direcciones', JSON.stringify(dirs));
  renderDirecciones();
  showToast('Dirección eliminada');
};

window.guardarDireccion = () => {
  const nombre = document.getElementById('dir-nombre')?.value.trim();
  const pais   = document.getElementById('dir-pais')?.value.trim();
  const calle  = document.getElementById('dir-calle')?.value.trim();
  const ciudad = document.getElementById('dir-ciudad')?.value.trim();
  const cp     = document.getElementById('dir-cp')?.value.trim();

  if (!nombre || !calle || !ciudad) {
    showToast('Rellena los campos obligatorios'); return;
  }
  const dirs = JSON.parse(localStorage.getItem('navicom-direcciones')) || [];
  dirs.push({ nombre, pais: pais||'España', calle, ciudad, cp });
  localStorage.setItem('navicom-direcciones', JSON.stringify(dirs));
  renderDirecciones();
  ['dir-nombre','dir-pais','dir-calle','dir-ciudad','dir-cp']
    .forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  showToast('Dirección guardada');
};

// ══ GUARDAR PERFIL ════════════════════════════════════
window.guardarPerfil = () => {
  const nombre   = document.getElementById('perfil-nombre')?.value.trim();
  const apellido = document.getElementById('perfil-apellido')?.value.trim();
  const email    = document.getElementById('perfil-email')?.value.trim();
  const tel      = document.getElementById('perfil-telefono')?.value.trim();
  const empresa  = document.getElementById('perfil-empresa')?.value.trim();

  const nombreCompleto = nombre + (apellido ? ' ' + apellido : '');
  const userData = { nombre: nombreCompleto, email, tel, empresa };
  localStorage.setItem('navicom-user', JSON.stringify(userData));

  const nameEl = document.getElementById('mc-hero-name');
  if (nameEl) nameEl.textContent = 'Bienvenido, ' + nombreCompleto;
  showToast('Perfil actualizado');
};

window.cambiarPassword = () => {
  const actual  = document.getElementById('pass-actual')?.value;
  const nueva   = document.getElementById('pass-nueva')?.value;
  const confirm = document.getElementById('pass-confirm')?.value;
  if (!actual || !nueva) { showToast('Rellena todos los campos'); return; }
  if (nueva !== confirm)  { showToast('Las contraseñas no coinciden'); return; }
  showToast('Contraseña actualizada');
};

// ══ CONFIGURACIÓN ═════════════════════════════════════
const configKey = 'navicom-config';
(function loadConfig() {
  const cfg = JSON.parse(localStorage.getItem(configKey)) || {};
  if (cfg.pedidos   !== undefined) document.getElementById('notif-pedidos').checked   = cfg.pedidos;
  if (cfg.ofertas   !== undefined) document.getElementById('notif-ofertas').checked   = cfg.ofertas;
  if (cfg.novedades !== undefined) document.getElementById('notif-novedades').checked = cfg.novedades;
})();

window.guardarConfig = () => {
  const cfg = {
    pedidos:   document.getElementById('notif-pedidos')?.checked,
    ofertas:   document.getElementById('notif-ofertas')?.checked,
    novedades: document.getElementById('notif-novedades')?.checked,
  };
  localStorage.setItem(configKey, JSON.stringify(cfg));
  showToast('Preferencias guardadas');
};

window.eliminarCuenta = () => {
  if (!confirm('¿Seguro que quieres eliminar tu cuenta? Esta acción es irreversible.')) return;
  localStorage.removeItem('navicom-user');
  localStorage.removeItem('navicom-pedidos');
  localStorage.removeItem('navicom-direcciones');
  localStorage.removeItem(configKey);
  window.location.href = './Incio.html';
};

// ══ CAMBIAR CUENTA / LOGOUT ═══════════════════════════
document.getElementById('btn-logout')?.addEventListener('click', async () => {
  // Limpiar datos ANTES de cualquier cosa
  localStorage.removeItem('navicom-user');
  localStorage.removeItem('navicom-cart');
  sessionStorage.setItem('navicom-logout', 'true');

  try {
    const { getAuth, signOut } = await import("https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js");
    await signOut(getAuth());
  } catch(e) {
    console.warn('Firebase signOut error:', e);
  }

  window.location.href = './iniciarSesion.html';
});

// ══ TOAST ═════════════════════════════════════════════
function showToast(msg) {
  const t = document.getElementById('toast');
  const m = document.getElementById('toast-msg');
  if (!t || !m) return;
  m.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ══ CAMBIAR CUENTA ════════════════════════════════════
window.cambiarCuenta = async () => {
  localStorage.removeItem('navicom-user');
  localStorage.removeItem('navicom-cart');
  sessionStorage.setItem('navicom-logout', 'true');

  try {
    const { getAuth, signOut } = await import("https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js");
    await signOut(getAuth());
  } catch(e) {
    console.warn('Firebase signOut error:', e);
  }

  window.location.href = './iniciarSesion.html';
};

// ══ showPanel (para el botón Cancelar de cambiar cuenta) ══
window.showPanel = (panel) => {
  document.querySelectorAll('.mc-navbtn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.mc-panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`.mc-navbtn[data-panel="${panel}"]`)?.classList.add('active');
  document.getElementById('panel-' + panel)?.classList.add('active');
};