const PRODUCTOS = [
  { id: 1, nombre: 'iPhone 15 Pro Max', categoria: 'celulares', precio: 1499, precioOriginal: 1699, badge: 'offer', rating: 4.9, reviews: 342 },
  { id: 2, nombre: 'Samsung Galaxy S24 Ultra', categoria: 'celulares', precio: 1349, precioOriginal: null, badge: 'new', rating: 4.8, reviews: 218 },
  { id: 3, nombre: 'MacBook Pro 14" M3', categoria: 'notebooks', precio: 1999, precioOriginal: 2199, badge: 'offer', rating: 4.9, reviews: 504 },
  { id: 4, nombre: 'Dell XPS 15 OLED', categoria: 'notebooks', precio: 1699, precioOriginal: null, badge: null, rating: 4.7, reviews: 189 },
  { id: 5, nombre: 'AirPods Pro 2nd Gen', categoria: 'accesorios', precio: 249, precioOriginal: 299, badge: 'offer', rating: 4.8, reviews: 912 },
  { id: 6, nombre: 'Logitech MX Master 3S', categoria: 'accesorios', precio: 99, precioOriginal: null, badge: null, rating: 4.8, reviews: 456 },
  { id: 7, nombre: 'iPad Pro 12.9" M4', categoria: 'tablets', precio: 1099, precioOriginal: 1199, badge: 'new', rating: 4.9, reviews: 427 },
  { id: 8, nombre: 'ASUS ROG Zephyrus G14', categoria: 'notebooks', precio: 1599, precioOriginal: null, badge: 'new', rating: 4.7, reviews: 321 },
  { id: 9, nombre: 'Nintendo Switch OLED', categoria: 'gaming', precio: 349, precioOriginal: null, badge: null, rating: 4.8, reviews: 2341 },
  { id: 10, nombre: 'Apple Watch Series 9', categoria: 'accesorios', precio: 399, precioOriginal: 449, badge: 'offer', rating: 4.8, reviews: 761 },
  { id: 11, nombre: 'Sony WH-1000XM5', categoria: 'accesorios', precio: 349, precioOriginal: null, badge: null, rating: 4.7, reviews: 842 }
];

const IMAGENES = [
  { idProducto: 1, ruta: '../imagenes_productos/Iphone15ProMax_1.png' },
  { idProducto: 1, ruta: '../imagenes_productos/Iphone15ProMax_2.png' },
  { idProducto: 1, ruta: '../imagenes_productos/Iphone15ProMax_3.png' },
  { idProducto: 2, ruta: '../imagenes_productos/Screenshot_1.png' },
  { idProducto: 3, ruta: '../imagenes_productos/Screenshot_2.png' },
  { idProducto: 3, ruta: '../imagenes_productos/Screenshot_3.png' },
  { idProducto: 4, ruta: '../imagenes_productos/Screenshot_4.png' },
  { idProducto: 4, ruta: '../imagenes_productos/Screenshot_5.png' },
  { idProducto: 4, ruta: '../imagenes_productos/Screenshot_6.png' },
  { idProducto: 4, ruta: '../imagenes_productos/Screenshot_7.png' },
  { idProducto: 5, ruta: '../imagenes_productos/Screenshot_8.png' },
  { idProducto: 5, ruta: '../imagenes_productos/Screenshot_9.png' },
  { idProducto: 6, ruta: '../imagenes_productos/Screenshot_10.png' },
  { idProducto: 6, ruta: '../imagenes_productos/Screenshot_11.png' },
  { idProducto: 7, ruta: '../imagenes_productos/Screenshot_12.png' },
  { idProducto: 8, ruta: '../imagenes_productos/Screenshot_13.png' },
  { idProducto: 8, ruta: '../imagenes_productos/Screenshot_14.png' },
  { idProducto: 8, ruta: '../imagenes_productos/Screenshot_15.png' },
  { idProducto: 9, ruta: '../imagenes_productos/Screenshot_16.png' },
  { idProducto: 9, ruta: '../imagenes_productos/Screenshot_17.png' },
  { idProducto: 9, ruta: '../imagenes_productos/Screenshot_18.png' },
  { idProducto: 10, ruta: '../imagenes_productos/Screenshot_19.png' },
  { idProducto: 11, ruta: '../imagenes_productos/Screenshot_20.png' },
  { idProducto: 11, ruta: '../imagenes_productos/Screenshot_21.png' }
];



const FALLBACK_EMOJI = {
  celulares: '📱',
  notebooks: '💻',
  accesorios: '🎧',
  gaming: '🎮',
  tablets: '📲'
};

const mapaImagenes = new Map();
const indicesImagenes = new Map();
let cart = [];
let filters = { search: '', category: 'todos', maxPrice: 2500, sort: 'default' };
const CLAVE_SESION = 'nst_user_session';
const CLAVE_USUARIOS = 'nst_users';
const CLAVE_COMPRAS = 'compras';
let usuarioSesionActual = null;
let modalAutenticacion = null;
let modalAccionActual = 'iniciar';
let modalHistorialCompras = null;

function cargarComprasTotales() {
  const comprasCrudas = localStorage.getItem(CLAVE_COMPRAS);
  if (!comprasCrudas) return [];

  try {
    const comprasParseadas = JSON.parse(comprasCrudas);
    return Array.isArray(comprasParseadas) ? comprasParseadas : [];
  } catch {
    return [];
  }
}

function guardarComprasTotales(compras) {
  localStorage.setItem(CLAVE_COMPRAS, JSON.stringify(compras));
}

function obtenerComprasUsuario(email) {
  const compras = cargarComprasTotales();
  return compras
    .filter(compra => compra.email === email)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}




function escaparHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizarEmail(emailCrudo = '') {
  return emailCrudo.trim().toLowerCase();
}

function validarEmail(email = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function cargarUsuarios() {
  const usuariosCrudos = localStorage.getItem(CLAVE_USUARIOS);
  if (!usuariosCrudos) return [];

  try {
    const usuarios = JSON.parse(usuariosCrudos);
    if (!Array.isArray(usuarios)) return [];
    return usuarios.filter(usuario =>
      usuario
      && typeof usuario.email === 'string'
      && typeof usuario.password === 'string'
    );
  } catch {
    return [];
  }
}

function guardarUsuarios(usuarios) {
  localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios));
}

function cargarSesion() {
  const sesionCruda = localStorage.getItem(CLAVE_SESION);
  if (!sesionCruda) return;

  try {
    const sesionParseada = JSON.parse(sesionCruda);
    if (sesionParseada && typeof sesionParseada.email === 'string' && validarEmail(sesionParseada.email)) {
      usuarioSesionActual = { email: normalizarEmail(sesionParseada.email) };
    }
  } catch {
    usuarioSesionActual = null;
  }
}

function guardarSesion() {
  if (!usuarioSesionActual) {
    localStorage.removeItem(CLAVE_SESION);
    return;
  }

  localStorage.setItem(CLAVE_SESION, JSON.stringify(usuarioSesionActual));
}

function formatearMoneda(monto) {
  return `$${Number(monto || 0).toLocaleString('es-AR')}`;
}

function formatearFecha(fechaIso) {
  const fecha = new Date(fechaIso);
  return fecha.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function generarIdCompra() {
  const marcaTiempo = Date.now().toString(36).toUpperCase();
  const aleatorio = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `NS-${marcaTiempo}-${aleatorio}`;
}

function registrarCompra() {
  if (!usuarioSesionActual) {
    showToast('Inicia sesión para finalizar la compra', '🔐');
    abrirModalAutenticacion('iniciar');
    return false;
  }

  if (!cart.length) {
    showToast('Tu carrito está vacío', '🛒');
    return false;
  }

  const total = cart.reduce((acum, item) => acum + item.precio * item.qty, 0);
  const compra = {
    id: generarIdCompra(),
    email: usuarioSesionActual.email,
    fecha: new Date().toISOString(),
    total,
    cantidadItems: cart.reduce((acum, item) => acum + item.qty, 0),
    items: cart.map(item => ({
      id: item.id,
      nombre: item.nombre,
      precio: item.precio,
      qty: item.qty,
      emoji: item.emoji
    }))
  };

  const compras = cargarComprasTotales();
  compras.push(compra);
  guardarComprasTotales(compras);

  cart = [];
  saveCart();
  updateCartUI();
  renderCartItems();
  closeCart();

  showToast(`Compra confirmada por <strong>${formatearMoneda(total)}</strong>`, '🎉');
  return true;
}

function crearModalHistorialCompras() {
  if (modalHistorialCompras) return modalHistorialCompras;

  const overlay = document.createElement('div');
  overlay.className = 'history-modal-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="history-modal" role="dialog" aria-modal="true" aria-labelledby="history-modal-title">
      <button type="button" class="history-modal-close" id="history-modal-close" aria-label="Cerrar">✕</button>
      <div class="history-modal-badge">HISTORIAL NEXTSTEP</div>
      <h3 class="history-modal-title" id="history-modal-title">Mis compras</h3>
      <p class="history-modal-sub" id="history-modal-sub">Tus compras recientes.</p>
      <div class="history-modal-content" id="history-modal-content"></div>
    </div>`;

  document.body.appendChild(overlay);

  const closeBtn = overlay.querySelector('#history-modal-close');
  overlay.addEventListener('click', event => {
    if (event.target === overlay) cerrarModalHistorialCompras();
  });
  closeBtn?.addEventListener('click', cerrarModalHistorialCompras);

  modalHistorialCompras = overlay;
  return overlay;
}

function renderizarHistorialCompras() {
  const overlay = crearModalHistorialCompras();
  const contenedor = overlay.querySelector('#history-modal-content');
  const subtitulo = overlay.querySelector('#history-modal-sub');
  if (!contenedor) return;

  const email = usuarioSesionActual?.email || '';
  const comprasUsuario = obtenerComprasUsuario(email);
  if (subtitulo) {
    subtitulo.textContent = comprasUsuario.length
      ? `${comprasUsuario.length} compra(s) realizadas con ${email}`
      : 'Todavía no registras compras en tu cuenta.';
  }

  if (!comprasUsuario.length) {
    contenedor.innerHTML = `
      <div class="history-empty">
        <div class="history-empty-icon">🧾</div>
        <p>Aún no hay compras para mostrar.</p>
      </div>`;
    return;
  }

  contenedor.innerHTML = comprasUsuario.map(compra => {
    const itemsHtml = compra.items.map(item => `
      <div class="history-item-row">
        <div class="history-item-name">${item.emoji || '📦'} ${escaparHtml(item.nombre)}</div>
        <div class="history-item-meta">x${item.qty} · ${formatearMoneda(item.precio * item.qty)}</div>
      </div>`).join('');

    return `
      <article class="history-card">
        <div class="history-card-head">
          <div>
            <div class="history-id">${compra.id}</div>
            <div class="history-date">${formatearFecha(compra.fecha)}</div>
          </div>
          <div class="history-total">${formatearMoneda(compra.total)}</div>
        </div>
        <div class="history-items">${itemsHtml}</div>
      </article>`;
  }).join('');
}

function abrirModalHistorialCompras() {
  if (!usuarioSesionActual) {
    showToast('Inicia sesión para ver tus compras', '🔐');
    abrirModalAutenticacion('iniciar');
    return;
  }

  const overlay = crearModalHistorialCompras();
  renderizarHistorialCompras();
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('open'));
  document.body.style.overflow = 'hidden';
}

function cerrarModalHistorialCompras() {
  if (!modalHistorialCompras) return;
  modalHistorialCompras.classList.remove('open');
  modalHistorialCompras.hidden = true;
  document.body.style.overflow = '';
}

function cerrarMenuUsuario() {
  const menu = document.getElementById('user-menu');
  const button = document.getElementById('user-menu-btn');
  if (!menu || !button) return;
  menu.hidden = true;
  button.setAttribute('aria-expanded', 'false');
}

function abrirMenuUsuario() {
  const menu = document.getElementById('user-menu');
  const button = document.getElementById('user-menu-btn');
  if (!menu || !button) return;
  menu.hidden = false;
  button.setAttribute('aria-expanded', 'true');
}

function crearModalAutenticacion() {
  if (modalAutenticacion) return modalAutenticacion;

  const overlay = document.createElement('div');
  overlay.className = 'auth-modal-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <button type="button" class="auth-modal-close" id="auth-modal-close" aria-label="Cerrar">✕</button>
      <div class="auth-modal-badge">NEXTSTEP ACCESS</div>
      <h3 class="auth-modal-title" id="auth-modal-title">Bienvenido</h3>
      <p class="auth-modal-sub" id="auth-modal-sub">Ingresa tus datos para continuar.</p>
      <form class="auth-modal-form" id="auth-modal-form">
        <label class="auth-modal-label" for="auth-modal-email">Email</label>
        <input class="auth-modal-input" id="auth-modal-email" type="email" placeholder="tu@email.com" autocomplete="email" required />
        <label class="auth-modal-label" for="auth-modal-password">Contraseña</label>
        <div class="auth-modal-password-wrap">
          <input class="auth-modal-input" id="auth-modal-password" type="password" placeholder="Minimo 6 caracteres" minlength="6" autocomplete="current-password" required />
          <button type="button" class="auth-modal-toggle-pass" data-toggle-pass="auth-modal-password">Mostrar</button>
        </div>
        <div id="auth-confirm-group">
          <label class="auth-modal-label" for="auth-modal-confirm-password">Confirmar Contraseña</label>
          <div class="auth-modal-password-wrap">
            <input class="auth-modal-input" id="auth-modal-confirm-password" type="password" placeholder="Confirma tu contraseña" minlength="6" autocomplete="current-password" />
            <button type="button" class="auth-modal-toggle-pass" data-toggle-pass="auth-modal-confirm-password">Mostrar</button>
          </div>
        </div>
        <div class="auth-modal-actions">
          <button type="button" class="btn btn-ghost auth-modal-btn-cancel" id="auth-modal-cancel">Cancelar</button>
          <button type="submit" class="btn btn-primary" id="auth-modal-submit">Continuar</button>
        </div>
      </form>
    </div>`;

  document.body.appendChild(overlay);

  const form = overlay.querySelector('#auth-modal-form');
  const closeBtn = overlay.querySelector('#auth-modal-close');
  const cancelBtn = overlay.querySelector('#auth-modal-cancel');
  const togglesPassword = overlay.querySelectorAll('[data-toggle-pass]');

  overlay.addEventListener('click', event => {
    if (event.target === overlay) cerrarModalAutenticacion();
  });
  closeBtn?.addEventListener('click', cerrarModalAutenticacion);
  cancelBtn?.addEventListener('click', cerrarModalAutenticacion);
  togglesPassword.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const inputId = toggle.dataset.togglePass;
      if (!inputId) return;

      const input = overlay.querySelector(`#${inputId}`);
      if (!input) return;

      const mostrar = input.type === 'password';
      input.type = mostrar ? 'text' : 'password';
      toggle.textContent = mostrar ? 'Ocultar' : 'Mostrar';
      input.focus();
    });
  });
  form?.addEventListener('submit', confirmarAutenticacionModal);

  modalAutenticacion = overlay;
  return overlay;
}

function abrirModalAutenticacion(accion) {
  const overlay = crearModalAutenticacion();
  modalAccionActual = accion;

  const titulo = overlay.querySelector('#auth-modal-title');
  const subtitulo = overlay.querySelector('#auth-modal-sub');
  const botonEnviar = overlay.querySelector('#auth-modal-submit');
  const inputEmail = overlay.querySelector('#auth-modal-email');
  const inputPassword = overlay.querySelector('#auth-modal-password');
  const grupoConfirmacion = overlay.querySelector('#auth-confirm-group');
  const inputConfirmPassword = overlay.querySelector('#auth-modal-confirm-password');
  const togglesPassword = overlay.querySelectorAll('[data-toggle-pass]');

  const esRegistro = accion === 'registrar';
  if (titulo) titulo.textContent = esRegistro ? 'Crear cuenta' : 'Iniciar sesion';
  if (subtitulo) subtitulo.textContent = esRegistro ? 'Registrate con email y contraseña para empezar a comprar.' : 'Ingresa con email y contraseña para continuar tu compra.';
  if (botonEnviar) botonEnviar.textContent = esRegistro ? 'Registrarme' : 'Ingresar';
  if (inputEmail) inputEmail.value = '';
  if (inputPassword) inputPassword.value = '';
  if (inputConfirmPassword) inputConfirmPassword.value = '';
  if (inputPassword) inputPassword.autocomplete = esRegistro ? 'new-password' : 'current-password';
  if (inputConfirmPassword) inputConfirmPassword.autocomplete = esRegistro ? 'new-password' : 'current-password';

  if (grupoConfirmacion) grupoConfirmacion.hidden = !esRegistro;
  if (inputConfirmPassword) inputConfirmPassword.required = esRegistro;

  togglesPassword.forEach(toggle => {
    toggle.textContent = 'Mostrar';
    const inputId = toggle.dataset.togglePass;
    if (!inputId) return;
    const input = overlay.querySelector(`#${inputId}`);
    if (input) input.type = 'password';
  });

  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('open'));
  document.body.style.overflow = 'hidden';
  cerrarMenuUsuario();
  setTimeout(() => inputEmail?.focus(), 60);
}

function cerrarModalAutenticacion() {
  if (!modalAutenticacion) return;
  modalAutenticacion.classList.remove('open');
  modalAutenticacion.hidden = true;
  document.body.style.overflow = '';
}

function confirmarAutenticacionModal(event) {
  event.preventDefault();
  if (!modalAutenticacion) return;

  const inputEmail = modalAutenticacion.querySelector('#auth-modal-email');
  const inputPassword = modalAutenticacion.querySelector('#auth-modal-password');
  const inputConfirmPassword = modalAutenticacion.querySelector('#auth-modal-confirm-password');
  const email = normalizarEmail(inputEmail?.value || '');
  const password = (inputPassword?.value || '').trim();
  const confirmPassword = (inputConfirmPassword?.value || '').trim();

  if (!validarEmail(email)) {
    showToast('Ingresa un email valido', '⚠️');
    inputEmail?.focus();
    return;
  }

  if (password.length < 6) {
    showToast('La contraseña debe tener al menos 6 caracteres', '⚠️');
    inputPassword?.focus();
    return;
  }

  const usuarios = cargarUsuarios();
  const usuarioExistente = usuarios.find(usuario => usuario.email === email);

  if (modalAccionActual === 'registrar') {
    if (password !== confirmPassword) {
      showToast('Las contraseñas no coinciden', '⚠️');
      inputConfirmPassword?.focus();
      return;
    }

    if (usuarioExistente) {
      showToast('Ese email ya esta registrado', '⚠️');
      inputEmail?.focus();
      return;
    }

    usuarios.push({ email, password });
    guardarUsuarios(usuarios);
    usuarioSesionActual = { email };
    guardarSesion();
    renderizarMenuUsuario();
    cerrarModalAutenticacion();
    showToast(`Cuenta creada. Hola, <strong>${escaparHtml(email)}</strong>!`, '👋');
    return;
  }

  if (!usuarioExistente || usuarioExistente.password !== password) {
    showToast('Email o contraseña incorrectos', '⚠️');
    inputPassword?.focus();
    return;
  }

  usuarioSesionActual = { email };
  guardarSesion();
  renderizarMenuUsuario();
  cerrarModalAutenticacion();
  showToast(`Sesion iniciada. Hola, <strong>${escaparHtml(email)}</strong>!`, '👋');
}

function manejarAccionMenuUsuario(accion) {
  if (accion === 'iniciar') {
    abrirModalAutenticacion('iniciar');
    return;
  }

  if (accion === 'registrar') {
    abrirModalAutenticacion('registrar');
    return;
  }

  if (accion === 'perfil') {
    showToast('Proximamente: perfil de usuario', '👤');
    cerrarMenuUsuario();
    return;
  }

  if (accion === 'compras') {
    cerrarMenuUsuario();
    requestAnimationFrame(() => abrirModalHistorialCompras());
    return;
  }

  if (accion === 'cerrar') {
    usuarioSesionActual = null;
    guardarSesion();
    renderizarMenuUsuario();
    cerrarMenuUsuario();
    showToast('Sesión cerrada correctamente', '✅');
  }
}

function renderizarMenuUsuario() {
  const menu = document.getElementById('user-menu');
  const button = document.getElementById('user-menu-btn');
  if (!menu || !button) return;

  if (!usuarioSesionActual) {
    button.textContent = '👤';
    button.setAttribute('aria-label', 'Usuario');
    menu.innerHTML = `
      <button type="button" class="user-menu-item" data-user-action="iniciar">Iniciar sesion</button>
      <button type="button" class="user-menu-item" data-user-action="registrar">Registrarse</button>`;
  } else {
    const emailSeguro = escaparHtml(usuarioSesionActual.email);
    button.textContent = '🙂';
    button.setAttribute('aria-label', `Usuario ${emailSeguro}`);
    menu.innerHTML = `
      <div class="user-menu-header">${emailSeguro}</div>
      <button type="button" class="user-menu-item" data-user-action="perfil">Mi perfil</button>
      <button type="button" class="user-menu-item" data-user-action="compras">Mis compras</button>
      <div class="user-menu-sep"></div>
      <button type="button" class="user-menu-item danger" data-user-action="cerrar">Cerrar sesion</button>`;
  }

  menu.querySelectorAll('[data-user-action]').forEach(item => {
    item.addEventListener('click', () => manejarAccionMenuUsuario(item.dataset.userAction));
  });
}

function iniciarMenuUsuario() {
  const wrap = document.getElementById('user-menu-wrap');
  const menu = document.getElementById('user-menu');
  const button = document.getElementById('user-menu-btn');
  if (!wrap || !menu || !button) return;

  renderizarMenuUsuario();
  cerrarMenuUsuario();

  button.addEventListener('click', event => {
    event.stopPropagation();
    const isOpen = !menu.hidden;
    if (isOpen) cerrarMenuUsuario();
    else abrirMenuUsuario();
  });

  menu.addEventListener('click', event => event.stopPropagation());
  document.addEventListener('click', event => {
    if (!wrap.contains(event.target)) cerrarMenuUsuario();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      cerrarMenuUsuario();
      cerrarModalAutenticacion();
      cerrarModalHistorialCompras();
    }
  });
}

function normalizeImagePath(path) {
  return path
    .replace(/\\/g, '/')
    .replace('../imagenes_productos/', '../ImagenesProductos/')
    .replace('../Imagenes_productos/', '../ImagenesProductos/')
    .replace('../imagenesProductos/', '../ImagenesProductos/')
    .replace('../imagenesproductos/', '../ImagenesProductos/');
}

function initImageMap() {
  IMAGENES.forEach(item => {
    const current = mapaImagenes.get(item.idProducto) || [];
    current.push(normalizeImagePath(item.ruta));
    mapaImagenes.set(item.idProducto, current);
  });
}

function getProductImages(productId) {
  return mapaImagenes.get(productId) || [];
}

function obtenerEtiquetaCategoria(categoria) {
  const etiquetas = {
    celulares: 'Celulares',
    notebooks: 'Portatiles',
    accesorios: 'Accesorios',
    gaming: 'Gaming',
    tablets: 'Tabletas'
  };

  return etiquetas[categoria] || categoria;
}

const PRODUCTOS_UI = PRODUCTOS.map(producto => ({
  id: producto.id,
  nombre: producto.nombre,
  categoria: producto.categoria,
  precio: producto.precio,
  precioOriginal: producto.precioOriginal,
  badge: producto.badge,
  calificacion: producto.rating,
  resenas: producto.reviews,
  emoji: FALLBACK_EMOJI[producto.categoria] || '📦'
}));

function loadCart() {
  const raw = localStorage.getItem('nst_cart');
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) cart = parsed;
  } catch {
    cart = [];
  }
}

function saveCart() {
  localStorage.setItem('nst_cart', JSON.stringify(cart));
}

function getCartItem(id) {
  return cart.find(item => item.id === id);
}

function addToCart(id) {
  const producto = PRODUCTOS_UI.find(item => item.id === id);
  if (!producto) return;

  const existing = getCartItem(id);
  if (existing) existing.qty += 1;
  else cart.push({ ...producto, qty: 1 });

  saveCart();
  updateCartUI();
  showToast(`<strong>${producto.nombre}</strong> agregado al carrito`, '✅');
  animateBadge();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  updateCartUI();
  renderCartItems();
}

function changeQty(id, delta) {
  const item = getCartItem(id);
  if (!item) return;
  item.qty += delta;

  if (item.qty <= 0) {
    removeFromCart(id);
    return;
  }

  saveCart();
  updateCartUI();
  renderCartItems();
}

function updateCartUI() {
  const count = cart.reduce((acc, item) => acc + item.qty, 0);
  document.querySelectorAll('.cart-badge').forEach(badge => {
    badge.textContent = count;
    badge.style.display = count ? 'grid' : 'none';
  });
}

function animateBadge() {
  document.querySelectorAll('.cart-badge').forEach(badge => {
    badge.classList.remove('pop');
    void badge.offsetWidth;
    badge.classList.add('pop');
    setTimeout(() => badge.classList.remove('pop'), 280);
  });
}

function renderCartItems() {
  const container = document.getElementById('cart-items');
  if (!container) return;

  if (!cart.length) {
    container.innerHTML = `
      <div class="cart-empty">
        <span class="cart-empty-icon">🛒</span>
        <p>Tu carrito está vacío</p>
      </div>`;
    const totalValue = document.getElementById('cart-total-value');
    if (totalValue) totalValue.textContent = '$0';
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">${item.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.nombre}</div>
        <div class="cart-item-price">$${item.precio.toLocaleString()}</div>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
        <span>${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
      </div>
      <button class="cart-remove" onclick="removeFromCart(${item.id})" title="Eliminar">✕</button>
    </div>
  `).join('');

  const total = cart.reduce((acc, item) => acc + item.precio * item.qty, 0);
  const totalValue = document.getElementById('cart-total-value');
  if (totalValue) totalValue.textContent = `$${total.toLocaleString()}`;
}

function openCart() {
  document.getElementById('cart-overlay')?.classList.add('open');
  document.getElementById('cart-drawer')?.classList.add('open');
  renderCartItems();
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-overlay')?.classList.remove('open');
  document.getElementById('cart-drawer')?.classList.remove('open');
  document.body.style.overflow = '';
}

function initCheckoutButton() {
  document.querySelectorAll('.btn-checkout').forEach(button => {
    button.onclick = null;
    button.addEventListener('click', () => {
      const ok = registrarCompra();
      if (ok) abrirModalHistorialCompras();
    });
  });
}

function showToast(message, icon = '✅') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-text">${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');

  if (navbar) {
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      menu.classList.toggle('mobile-open');
    });

    menu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('open');
        menu.classList.remove('mobile-open');
      });
    });
  }

  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = (link.getAttribute('href') || '').split('#')[0];
    if (!href) return;
    if (href === path || (path === '' && href === 'index.html')) link.classList.add('active');
  });
}

function initAnimations() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-up, .stagger-children').forEach(el => observer.observe(el));
}

function getProductImageIndex(productId) {
  if (!indicesImagenes.has(productId)) indicesImagenes.set(productId, 0);
  return indicesImagenes.get(productId);
}

function setProductImageIndex(productId, index) {
  indicesImagenes.set(productId, index);
}

function renderProductMedia(product) {
  const images = getProductImages(product.id);
  if (!images.length) {
    return `<div class="product-card-img">${product.emoji}</div>`;
  }

  const currentIndex = getProductImageIndex(product.id) % images.length;
  const hasMultiple = images.length > 1;

  return `
    <div class="product-card-img product-card-media" data-product-id="${product.id}">
      <img class="product-media-img" src="${images[currentIndex]}" alt="${product.nombre}" loading="lazy" onerror="this.remove()" />
      ${hasMultiple ? `
        <button class="media-nav media-nav-prev" onclick="changeProductImage(${product.id}, -1, event)" aria-label="Foto anterior">‹</button>
        <button class="media-nav media-nav-next" onclick="changeProductImage(${product.id}, 1, event)" aria-label="Foto siguiente">›</button>
      ` : ''}
    </div>`;
}

function buildProductCard(product) {
  const badgeHtml = product.badge
    ? `<span class="product-card-badge ${product.badge}">${product.badge === 'offer' ? 'Oferta' : 'Nuevo'}</span>`
    : '';

  const originalHtml = product.precioOriginal
    ? `<span class="price-original">$${product.precioOriginal.toLocaleString()}</span>`
    : '';

  const stars = '★'.repeat(Math.floor(product.calificacion));

  return `
    <div class="product-card fade-up" data-id="${product.id}">
      ${badgeHtml}
      ${renderProductMedia(product)}
      <div class="product-card-body">
        <span class="product-card-cat">${obtenerEtiquetaCategoria(product.categoria)}</span>
        <div class="product-card-name">${product.nombre}</div>
        <div class="product-card-rating">
          <span class="stars">${stars}</span>
          <span class="rating-count">(${product.resenas})</span>
        </div>
        <div class="product-card-footer">
          <div class="product-card-price">
            <span class="price-current">$${product.precio.toLocaleString()}</span>
            ${originalHtml}
          </div>
          <div class="product-card-actions">
            <button class="btn-detail btn btn-sm" onclick="window.location.href='productos.html'">Ver más</button>
            <button class="btn-cart" onclick="addToCart(${product.id})" title="Agregar al carrito">🛒</button>
          </div>
        </div>
      </div>
    </div>`;
}

function changeProductImage(productId, direction, event) {
  if (event) event.stopPropagation();
  const images = getProductImages(productId);
  if (images.length <= 1) return;

  const current = getProductImageIndex(productId);
  let next = current + direction;
  if (next < 0) next = images.length - 1;
  if (next >= images.length) next = 0;
  setProductImageIndex(productId, next);

  const media = document.querySelector(`.product-card-media[data-product-id="${productId}"]`);
  if (!media) return;
  const img = media.querySelector('.product-media-img');
  if (img) {
    img.src = images[next];
  }
}

function renderFeaturedProducts() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;

  const destacados = PRODUCTOS_UI.filter(product => product.badge).slice(0, 8);
  grid.innerHTML = destacados.map(buildProductCard).join('');
  initAnimations();
}

function initHeroFloatingImages() {
  const cards = document.querySelectorAll('.hero-visual .device-card[data-product-id]');
  if (!cards.length) return;

  cards.forEach(card => {
    const id = parseInt(card.dataset.productId, 10);
    if (!id) return;

    const imgWrap = card.querySelector('.device-card-img');
    const fallback = card.querySelector('.device-card-fallback');
    if (!imgWrap) return;

    const images = getProductImages(id);
    if (!images.length) return;

    const img = document.createElement('img');
    img.src = images[0];
    img.alt = 'Producto destacado';
    img.loading = 'lazy';
    img.onerror = () => {
      img.remove();
      if (fallback) fallback.style.display = 'grid';
    };

    imgWrap.prepend(img);
    if (fallback) fallback.style.display = 'none';
  });
}

function renderProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  let filtrados = PRODUCTOS_UI.filter(product => {
    const porBusqueda = product.nombre.toLowerCase().includes(filters.search.toLowerCase());
    const porCategoria = filters.category === 'todos' || product.categoria === filters.category;
    const porPrecio = product.precio <= filters.maxPrice;
    return porBusqueda && porCategoria && porPrecio;
  });

  if (filters.sort === 'price-asc') filtrados = filtrados.sort((a, b) => a.precio - b.precio);
  if (filters.sort === 'price-desc') filtrados = filtrados.sort((a, b) => b.precio - a.precio);
  if (filters.sort === 'rating') filtrados = filtrados.sort((a, b) => b.calificacion - a.calificacion);

  const countEl = document.getElementById('products-count');
  if (countEl) countEl.innerHTML = `<strong>${filtrados.length}</strong> productos encontrados`;

  if (!filtrados.length) {
    grid.innerHTML = `
      <div class="no-results">
        <span class="no-results-icon">🔍</span>
        <h3>Sin resultados</h3>
        <p>Probá con otros filtros o términos de búsqueda</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtrados.map(buildProductCard).join('');
  initAnimations();
}

function actualizarContadoresCategoria() {
  const categorias = ['todos', 'celulares', 'notebooks', 'tablets', 'accesorios', 'gaming'];
  
  categorias.forEach(cat => {
    let count = 0;
    if (cat === 'todos') {
      count = PRODUCTOS_UI.length;
    } else {
      count = PRODUCTOS_UI.filter(p => p.categoria === cat).length;
    }
    
    const chip = document.querySelector(`.cat-chip[data-cat="${cat}"] .cat-chip-count`);
    if (chip) {
      chip.textContent = count;
    }
  });
}

function initProductsPage() {
  actualizarContadoresCategoria();
  
  const searchInput = document.getElementById('filter-search');
  if (searchInput) {
    searchInput.addEventListener('input', event => {
      filters.search = event.target.value;
      renderProducts();
    });
  }

  document.querySelectorAll('.cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      filters.category = chip.dataset.cat || 'todos';
      document.querySelectorAll('.cat-chip').forEach(item => item.classList.remove('active'));
      chip.classList.add('active');
      renderProducts();
    });
  });

  const priceRange = document.getElementById('price-range');
  const priceDisplay = document.getElementById('price-display');
  if (priceRange && priceDisplay) {
    priceRange.addEventListener('input', event => {
      filters.maxPrice = parseInt(event.target.value, 10);
      priceDisplay.textContent = `$${filters.maxPrice.toLocaleString()}`;
      renderProducts();
    });
  }

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', event => {
      filters.sort = event.target.value;
      renderProducts();
    });
  }

  const resetBtn = document.getElementById('filters-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      filters = { search: '', category: 'todos', maxPrice: 2500, sort: 'default' };
      if (searchInput) searchInput.value = '';
      if (priceRange) priceRange.value = 2500;
      if (priceDisplay) priceDisplay.textContent = '$2,500';
      if (sortSelect) sortSelect.value = 'default';
      document.querySelectorAll('.cat-chip').forEach(item => item.classList.remove('active'));
      document.querySelector('.cat-chip[data-cat="todos"]')?.classList.add('active');
      renderProducts();
    });
  }

  const grid = document.getElementById('products-grid');
  document.querySelectorAll('.view-btn').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      if (!grid) return;
      grid.style.gridTemplateColumns = button.dataset.view === 'list' ? '1fr' : '';
    });
  });

  const savedCat = localStorage.getItem('nst_filter_cat');
  if (savedCat) {
    localStorage.removeItem('nst_filter_cat');
    filters.category = savedCat;
    document.querySelectorAll('.cat-chip').forEach(item => item.classList.remove('active'));
    document.querySelector(`.cat-chip[data-cat="${savedCat}"]`)?.classList.add('active');
  }

  renderProducts();
}

function initCategoryCards() {
  document.querySelectorAll('.cat-card[data-cat]').forEach(card => {
    card.addEventListener('click', () => {
      localStorage.setItem('nst_filter_cat', card.dataset.cat || 'todos');
      window.location.href = 'productos.html';
    });
  });
}

const suscriptores = JSON.parse(localStorage.getItem('suscriptores')) || [];

function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();
    const input = form.querySelector('input[type="email"]');
    if (!input || !input.value) return;
    if(suscriptores.includes(input.value)) {
      showToast(`El email <strong>${input.value}</strong> ya está suscripto`, '⚠️');
      input.value = '';
      return;
    }
    showToast(`Suscripción confirmada para <strong>${input.value}</strong>`, '🎉');
    suscriptores.push(input.value);
    localStorage.setItem('suscriptores', JSON.stringify(suscriptores));
    input.value = '';
  });
}

window.addToCart = addToCart;
window.changeQty = changeQty;
window.removeFromCart = removeFromCart;
window.showToast = showToast;
window.changeProductImage = changeProductImage;

document.addEventListener('DOMContentLoaded', () => {
  initImageMap();
  loadCart();
  cargarSesion();
  initNavbar();
  iniciarMenuUsuario();
  initAnimations();
  initHeroFloatingImages();
  updateCartUI();

  renderFeaturedProducts();
  initCategoryCards();
  initNewsletter();
  initCheckoutButton();

  document.getElementById('cart-open-btn')?.addEventListener('click', openCart);
  document.getElementById('cart-close-btn')?.addEventListener('click', closeCart);
  document.getElementById('cart-overlay')?.addEventListener('click', closeCart);

  if (document.getElementById('products-grid')) initProductsPage();

  document.getElementById('hero-cta')?.addEventListener('click', () => {
    window.location.href = 'productos.html';
  });
});
