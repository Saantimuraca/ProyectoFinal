const PRODUCTOS = [];
let PRODUCTOS_UI = [];

const IMAGENES = [];

async function cargarDatosIniciales() {
  const [respuestaProductos, respuestaImagenes] = await Promise.all([
    fetch('./Backend/productos.json'),
    fetch('./Backend/imagenes.json')
  ]);

  if (!respuestaProductos.ok) {
    throw new Error(`No se pudo cargar productos.json: ${respuestaProductos.status}`);
  }

  if (!respuestaImagenes.ok) {
    throw new Error(`No se pudo cargar imagenes.json: ${respuestaImagenes.status}`);
  }

  const productos = await respuestaProductos.json();
  const imagenes = await respuestaImagenes.json();

  PRODUCTOS.push(...productos);
  IMAGENES.push(...imagenes);

  PRODUCTOS_UI = PRODUCTOS.map(producto => ({
    id: producto.id,
    nombre: producto.nombre,
    categoria: producto.categoria,
    precio: producto.precio,
    precioOriginal: producto.precioOriginal,
    badge: producto.badge,
    calificacion: producto.calificacion,
    resenas: producto.resenas,
    emoji: EMOJI_FALLBACK[producto.categoria] || '📦'
  }));
}


const EMOJI_FALLBACK = {
  celulares: '📱',
  notebooks: '💻',
  accesorios: '🎧',
  gaming: '🎮',
  tablets: '📲'
};

const mapaImagenes = new Map();
const indicesImagenes = new Map();
let carrito = [];
let filtros = { busqueda: '', categoria: 'todos', precioMax: 2500, orden: 'default' };
const CLAVE_SESION = 'nst_sesion_usuario';
const CLAVE_USUARIOS = 'nst_usuarios';
const CLAVE_COMPRAS = 'compras';
let usuarioSesionActual = null;
let modalAuth = null;
let modalAccionActual = 'iniciar';
let modalHistorial = null;

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
    .map(compra => ({
      ...compra,
      items: Array.isArray(compra.items)
        ? compra.items.map(item => ({
          ...item,
          precio: Number(item.precio ?? item.price ?? 0),
          cantidad: Number(item.cantidad ?? item.qty ?? 0)
        }))
        : []
    }))
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

function escaparHtml(valor = '') {
  return String(valor)
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
      && typeof usuario.contrasena === 'string'
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
    mostrarToast('Inicia sesión para finalizar la compra', '🔐');
    abrirModalAuth('iniciar');
    return false;
  }
  if (!carrito.length) {
    mostrarToast('Tu carrito está vacío', '🛒');
    return false;
  }
  const total = carrito.reduce((acum, item) => acum + item.precio * item.cantidad, 0);
  const compra = {
    id: generarIdCompra(),
    email: usuarioSesionActual.email,
    fecha: new Date().toISOString(),
    total,
    cantidadItems: carrito.reduce((acum, item) => acum + item.cantidad, 0),
    items: carrito.map(item => ({
      id: item.id,
      nombre: item.nombre,
      precio: item.precio,
      cantidad: item.cantidad,
      emoji: item.emoji
    }))
  };
  const compras = cargarComprasTotales();
  compras.push(compra);
  guardarComprasTotales(compras);
  carrito = [];
  guardarCarrito();
  actualizarUICarrito();
  renderizarItemsCarrito();
  cerrarCarrito();
  mostrarToast(`Compra confirmada por <strong>${formatearMoneda(total)}</strong>`, '🎉');
  return true;
}

function crearModalHistorial() {
  if (modalHistorial) return modalHistorial;
  const overlay = document.createElement('div');
  overlay.className = 'modal-historial-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="modal-historial" role="dialog" aria-modal="true" aria-labelledby="modal-historial-titulo">
      <button type="button" class="modal-historial-cerrar" id="modal-historial-cerrar" aria-label="Cerrar">✕</button>
      <div class="modal-historial-badge">HISTORIAL NEXTSTEP</div>
      <h3 class="modal-historial-titulo" id="modal-historial-titulo">Mis compras</h3>
      <p class="modal-historial-subtitulo" id="modal-historial-subtitulo">Tus compras recientes.</p>
      <div class="modal-historial-contenido" id="modal-historial-contenido"></div>
    </div>`;
  document.body.appendChild(overlay);
  const botonCerrar = overlay.querySelector('#modal-historial-cerrar');
  overlay.addEventListener('click', evento => {
    if (evento.target === overlay) cerrarModalHistorial();
  });
  botonCerrar?.addEventListener('click', cerrarModalHistorial);
  modalHistorial = overlay;
  return overlay;
}

function renderizarHistorial() {
  const overlay = crearModalHistorial();
  const contenedor = overlay.querySelector('#modal-historial-contenido');
  const subtitulo = overlay.querySelector('#modal-historial-subtitulo');
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
      <div class="historial-vacio">
        <div class="historial-vacio-icono">🧾</div>
        <p>Aún no hay compras para mostrar.</p>
      </div>`;
    return;
  }
  contenedor.innerHTML = comprasUsuario.map(compra => {
    const itemsHtml = compra.items.map(item => `
      <div class="historial-item-fila">
        <div class="historial-item-nombre">${item.emoji || '📦'} ${escaparHtml(item.nombre)}</div>
        <div class="historial-item-meta">x${item.cantidad} · ${formatearMoneda(item.precio * item.cantidad)}</div>
      </div>`).join('');
    return `
      <article class="tarjeta-historial">
        <div class="tarjeta-historial-encabezado">
          <div>
            <div class="historial-id">${compra.id}</div>
            <div class="historial-fecha">${formatearFecha(compra.fecha)}</div>
          </div>
          <div class="historial-total">${formatearMoneda(compra.total)}</div>
        </div>
        <div class="historial-items">${itemsHtml}</div>
      </article>`;
  }).join('');
}

function abrirModalHistorial() {
  if (!usuarioSesionActual) {
    mostrarToast('Inicia sesión para ver tus compras', '🔐');
    abrirModalAuth('iniciar');
    return;
  }
  const overlay = crearModalHistorial();
  renderizarHistorial();
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('abierto'));
  document.body.style.overflow = 'hidden';
}

function cerrarModalHistorial() {
  if (!modalHistorial) return;
  modalHistorial.classList.remove('abierto');
  modalHistorial.hidden = true;
  document.body.style.overflow = '';
}

function cerrarMenuUsuario() {
  const menu = document.getElementById('menu-usuario');
  const boton = document.getElementById('menu-usuario-btn');
  if (!menu || !boton) return;
  menu.hidden = true;
  boton.setAttribute('aria-expanded', 'false');
}

function abrirMenuUsuario() {
  const menu = document.getElementById('menu-usuario');
  const boton = document.getElementById('menu-usuario-btn');
  if (!menu || !boton) return;
  menu.hidden = false;
  boton.setAttribute('aria-expanded', 'true');
}

function crearModalAuth() {
  if (modalAuth) return modalAuth;
  const overlay = document.createElement('div');
  overlay.className = 'modal-auth-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="modal-auth" role="dialog" aria-modal="true" aria-labelledby="modal-auth-titulo">
      <button type="button" class="modal-auth-cerrar" id="modal-auth-cerrar" aria-label="Cerrar">✕</button>
      <div class="modal-auth-badge">NEXTSTEP ACCESS</div>
      <h3 class="modal-auth-titulo" id="modal-auth-titulo">Bienvenido</h3>
      <p class="modal-auth-subtitulo" id="modal-auth-subtitulo">Ingresa tus datos para continuar.</p>
      <form class="modal-auth-formulario" id="modal-auth-formulario">
        <label class="modal-auth-etiqueta" for="modal-auth-email">Email</label>
        <input class="modal-auth-input" id="modal-auth-email" type="email" placeholder="tu@email.com" autocomplete="email" required />
        <label class="modal-auth-etiqueta" for="modal-auth-contrasena">Contraseña</label>
        <div class="modal-auth-contrasena-contenedor">
          <input class="modal-auth-input" id="modal-auth-contrasena" type="password" placeholder="Minimo 6 caracteres" minlength="6" autocomplete="current-password" required />
          <button type="button" class="modal-auth-toggle-contrasena" data-toggle-contrasena="modal-auth-contrasena">Mostrar</button>
        </div>
        <div id="grupo-confirmacion">
          <label class="modal-auth-etiqueta" for="modal-auth-confirmar-contrasena">Confirmar Contraseña</label>
          <div class="modal-auth-contrasena-contenedor">
            <input class="modal-auth-input" id="modal-auth-confirmar-contrasena" type="password" placeholder="Confirma tu contraseña" minlength="6" autocomplete="current-password" />
            <button type="button" class="modal-auth-toggle-contrasena" data-toggle-contrasena="modal-auth-confirmar-contrasena">Mostrar</button>
          </div>
        </div>
        <div class="modal-auth-acciones">
          <button type="button" class="btn btn-fantasma modal-auth-btn-cancelar" id="modal-auth-cancelar">Cancelar</button>
          <button type="submit" class="btn btn-primario" id="modal-auth-enviar">Continuar</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(overlay);
  const formulario = overlay.querySelector('#modal-auth-formulario');
  const botonCerrar = overlay.querySelector('#modal-auth-cerrar');
  const botonCancelar = overlay.querySelector('#modal-auth-cancelar');
  const togglesContrasena = overlay.querySelectorAll('[data-toggle-contrasena]');
  overlay.addEventListener('click', evento => {
    if (evento.target === overlay) cerrarModalAuth();
  });
  botonCerrar?.addEventListener('click', cerrarModalAuth);
  botonCancelar?.addEventListener('click', cerrarModalAuth);
  togglesContrasena.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const inputId = toggle.dataset.toggleContrasena;
      if (!inputId) return;
      const input = overlay.querySelector(`#${inputId}`);
      if (!input) return;
      const mostrar = input.type === 'password';
      input.type = mostrar ? 'text' : 'password';
      toggle.textContent = mostrar ? 'Ocultar' : 'Mostrar';
      input.focus();
    });
  });
  formulario?.addEventListener('submit', confirmarAuth);
  modalAuth = overlay;
  return overlay;
}

function abrirModalAuth(accion) {
  const overlay = crearModalAuth();
  modalAccionActual = accion;
  const titulo = overlay.querySelector('#modal-auth-titulo');
  const subtitulo = overlay.querySelector('#modal-auth-subtitulo');
  const botonEnviar = overlay.querySelector('#modal-auth-enviar');
  const inputEmail = overlay.querySelector('#modal-auth-email');
  const inputContrasena = overlay.querySelector('#modal-auth-contrasena');
  const grupoConfirmacion = overlay.querySelector('#grupo-confirmacion');
  const inputConfirmarContrasena = overlay.querySelector('#modal-auth-confirmar-contrasena');
  const togglesContrasena = overlay.querySelectorAll('[data-toggle-contrasena]');
  const esRegistro = accion === 'registrar';
  if (titulo) titulo.textContent = esRegistro ? 'Crear cuenta' : 'Iniciar sesion';
  if (subtitulo) subtitulo.textContent = esRegistro ? 'Registrate con email y contraseña para empezar a comprar.' : 'Ingresa con email y contraseña para continuar tu compra.';
  if (botonEnviar) botonEnviar.textContent = esRegistro ? 'Registrarme' : 'Ingresar';
  if (inputEmail) inputEmail.value = '';
  if (inputContrasena) inputContrasena.value = '';
  if (inputConfirmarContrasena) inputConfirmarContrasena.value = '';
  if (inputContrasena) inputContrasena.autocomplete = esRegistro ? 'new-password' : 'current-password';
  if (inputConfirmarContrasena) inputConfirmarContrasena.autocomplete = esRegistro ? 'new-password' : 'current-password';
  if (grupoConfirmacion) grupoConfirmacion.hidden = !esRegistro;
  if (inputConfirmarContrasena) inputConfirmarContrasena.required = esRegistro;
  togglesContrasena.forEach(toggle => {
    toggle.textContent = 'Mostrar';
    const inputId = toggle.dataset.toggleContrasena;
    if (!inputId) return;
    const input = overlay.querySelector(`#${inputId}`);
    if (input) input.type = 'password';
  });
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('abierto'));
  document.body.style.overflow = 'hidden';
  cerrarMenuUsuario();
  setTimeout(() => inputEmail?.focus(), 60);
}

function cerrarModalAuth() {
  if (!modalAuth) return;
  modalAuth.classList.remove('abierto');
  modalAuth.hidden = true;
  document.body.style.overflow = '';
}

function confirmarAuth(evento) {
  evento.preventDefault();
  if (!modalAuth) return;
  const inputEmail = modalAuth.querySelector('#modal-auth-email');
  const inputContrasena = modalAuth.querySelector('#modal-auth-contrasena');
  const inputConfirmarContrasena = modalAuth.querySelector('#modal-auth-confirmar-contrasena');
  const email = normalizarEmail(inputEmail?.value || '');
  const contrasena = (inputContrasena?.value || '').trim();
  const confirmarContrasena = (inputConfirmarContrasena?.value || '').trim();
  if (!validarEmail(email)) {
    mostrarToast('Ingresa un email valido', '⚠️');
    inputEmail?.focus();
    return;
  }
  if (contrasena.length < 6) {
    mostrarToast('La contraseña debe tener al menos 6 caracteres', '⚠️');
    inputContrasena?.focus();
    return;
  }
  const usuarios = cargarUsuarios();
  const usuarioExistente = usuarios.find(usuario => usuario.email === email);
  if (modalAccionActual === 'registrar') {
    if (contrasena !== confirmarContrasena) {
      mostrarToast('Las contraseñas no coinciden', '⚠️');
      inputConfirmarContrasena?.focus();
      return;
    }
    if (usuarioExistente) {
      mostrarToast('Ese email ya esta registrado', '⚠️');
      inputEmail?.focus();
      return;
    }
    usuarios.push({ email, contrasena });
    guardarUsuarios(usuarios);
    usuarioSesionActual = { email };
    guardarSesion();
    renderizarMenuUsuario();
    cerrarModalAuth();
    mostrarToast(`Cuenta creada. Hola, <strong>${escaparHtml(email)}</strong>!`, '👋');
    return;
  }
  if (!usuarioExistente || usuarioExistente.contrasena !== contrasena) {
    mostrarToast('Email o contraseña incorrectos', '⚠️');
    inputContrasena?.focus();
    return;
  }
  usuarioSesionActual = { email };
  guardarSesion();
  renderizarMenuUsuario();
  cerrarModalAuth();
  mostrarToast(`Sesion iniciada. Hola, <strong>${escaparHtml(email)}</strong>!`, '👋');
}

function manejarAccionMenuUsuario(accion) {
  if (accion === 'iniciar') {
    abrirModalAuth('iniciar');
    return;
  }
  if (accion === 'registrar') {
    abrirModalAuth('registrar');
    return;
  }
  if (accion === 'perfil') {
    mostrarToast('Proximamente: perfil de usuario', '👤');
    cerrarMenuUsuario();
    return;
  }
  if (accion === 'compras') {
    cerrarMenuUsuario();
    requestAnimationFrame(() => abrirModalHistorial());
    return;
  }
  if (accion === 'cerrar') {
    usuarioSesionActual = null;
    guardarSesion();
    renderizarMenuUsuario();
    cerrarMenuUsuario();
    mostrarToast('Sesión cerrada correctamente', '✅');
  }
}

function renderizarMenuUsuario() {
  const menu = document.getElementById('menu-usuario');
  const boton = document.getElementById('menu-usuario-btn');
  if (!menu || !boton) return;
  if (!usuarioSesionActual) {
    boton.textContent = '👤';
    boton.setAttribute('aria-label', 'Usuario');
    menu.innerHTML = `
      <button type="button" class="menu-usuario-item" data-accion-usuario="iniciar">Iniciar sesion</button>
      <button type="button" class="menu-usuario-item" data-accion-usuario="registrar">Registrarse</button>`;
  } else {
    const emailSeguro = escaparHtml(usuarioSesionActual.email);
    boton.textContent = '🙂';
    boton.setAttribute('aria-label', `Usuario ${emailSeguro}`);
    menu.innerHTML = `
      <div class="menu-usuario-encabezado">${emailSeguro}</div>
      <button type="button" class="menu-usuario-item" data-accion-usuario="perfil">Mi perfil</button>
      <button type="button" class="menu-usuario-item" data-accion-usuario="compras">Mis compras</button>
      <div class="menu-usuario-separador"></div>
      <button type="button" class="menu-usuario-item peligro" data-accion-usuario="cerrar">Cerrar sesion</button>`;
  }
  menu.querySelectorAll('[data-accion-usuario]').forEach(item => {
    item.addEventListener('click', () => manejarAccionMenuUsuario(item.dataset.accionUsuario));
  });
}

function iniciarMenuUsuario() {
  const contenedor = document.getElementById('menu-usuario-contenedor');
  const menu = document.getElementById('menu-usuario');
  const boton = document.getElementById('menu-usuario-btn');
  if (!contenedor || !menu || !boton) return;
  renderizarMenuUsuario();
  cerrarMenuUsuario();
  boton.addEventListener('click', evento => {
    evento.stopPropagation();
    const estaAbierto = !menu.hidden;
    if (estaAbierto) cerrarMenuUsuario();
    else abrirMenuUsuario();
  });
  menu.addEventListener('click', evento => evento.stopPropagation());
  document.addEventListener('click', evento => {
    if (!contenedor.contains(evento.target)) cerrarMenuUsuario();
  });
  document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape') {
      cerrarMenuUsuario();
      cerrarModalAuth();
      cerrarModalHistorial();
    }
  });
}

function normalizarRutaImagen(ruta) {
  return ruta
    .replace(/\\/g, '/')
    .replace('./imagenes_productos/', './ImagenesProductos/')
    .replace('./Imagenes_productos/', './ImagenesProductos/')
    .replace('./imagenesProductos/', './ImagenesProductos/')
    .replace('./imagenesproductos/', './ImagenesProductos/');
}

function inicializarMapaImagenes() {
  IMAGENES.forEach(item => {
    const actual = mapaImagenes.get(item.idProducto) || [];
    actual.push(normalizarRutaImagen(item.ruta));
    mapaImagenes.set(item.idProducto, actual);
  });
}

function obtenerImagenesProducto(idProducto) {
  return mapaImagenes.get(idProducto) || [];
}

function obtenerEtiquetaCategoria(categoria) {
  const etiquetas = {
    celulares: 'Celulares',
    notebooks: 'Portátiles',
    accesorios: 'Accesorios',
    gaming: 'Gaming',
    tablets: 'Tabletas'
  };
  return etiquetas[categoria] || categoria;
}

function cargarCarrito() {
  const crudo = localStorage.getItem('nst_carrito');
  if (!crudo) return;
  try {
    const parseado = JSON.parse(crudo);
    if (Array.isArray(parseado)) carrito = parseado;
  } catch {
    carrito = [];
  }
}

function guardarCarrito() {
  localStorage.setItem('nst_carrito', JSON.stringify(carrito));
}

function obtenerItemCarrito(id) {
  return carrito.find(item => item.id === id);
}

function agregarAlCarrito(id) {
  const producto = PRODUCTOS_UI.find(item => item.id === id);
  if (!producto) return;
  const existente = obtenerItemCarrito(id);
  if (existente) existente.cantidad += 1;
  else carrito.push({ ...producto, cantidad: 1 });
  guardarCarrito();
  actualizarUICarrito();
  mostrarToast(`<strong>${producto.nombre}</strong> agregado al carrito`, '✅');
  animarBadge();
}

function eliminarDelCarrito(id) {
  carrito = carrito.filter(item => item.id !== id);
  guardarCarrito();
  actualizarUICarrito();
  renderizarItemsCarrito();
}

function cambiarCantidad(id, delta) {
  const item = obtenerItemCarrito(id);
  if (!item) return;
  item.cantidad += delta;
  if (item.cantidad <= 0) {
    eliminarDelCarrito(id);
    return;
  }
  guardarCarrito();
  actualizarUICarrito();
  renderizarItemsCarrito();
}

function actualizarUICarrito() {
  const cantidad = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  document.querySelectorAll('.carrito-badge').forEach(badge => {
    badge.textContent = cantidad;
    badge.style.display = cantidad ? 'grid' : 'none';
  });
}

function animarBadge() {
  document.querySelectorAll('.carrito-badge').forEach(badge => {
    badge.classList.remove('pop');
    void badge.offsetWidth;
    badge.classList.add('pop');
    setTimeout(() => badge.classList.remove('pop'), 280);
  });
}

function renderizarItemsCarrito() {
  const contenedor = document.getElementById('carrito-items');
  if (!contenedor) return;
  if (!carrito.length) {
    contenedor.innerHTML = `
      <div class="carrito-vacio">
        <span class="carrito-vacio-icono">🛒</span>
        <p>Tu carrito está vacío</p>
      </div>`;
    const totalValor = document.getElementById('carrito-total-valor');
    if (totalValor) totalValor.textContent = '$0';
    return;
  }
  contenedor.innerHTML = carrito.map(item => `
    <div class="carrito-item">
      <div class="carrito-item-img">${item.emoji}</div>
      <div class="carrito-item-info">
        <div class="carrito-item-nombre">${item.nombre}</div>
        <div class="carrito-item-precio">$${item.precio.toLocaleString()}</div>
      </div>
      <div class="carrito-item-cantidad">
        <button class="btn-cantidad" onclick="cambiarCantidad(${item.id}, -1)">−</button>
        <span>${item.cantidad}</span>
        <button class="btn-cantidad" onclick="cambiarCantidad(${item.id}, 1)">+</button>
      </div>
      <button class="carrito-eliminar" onclick="eliminarDelCarrito(${item.id})" title="Eliminar">✕</button>
    </div>
  `).join('');
  const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  const totalValor = document.getElementById('carrito-total-valor');
  if (totalValor) totalValor.textContent = `$${total.toLocaleString()}`;
}

function abrirCarrito() {
  document.getElementById('carrito-overlay')?.classList.add('abierto');
  document.getElementById('carrito-panel')?.classList.add('abierto');
  renderizarItemsCarrito();
  document.body.style.overflow = 'hidden';
}

function cerrarCarrito() {
  document.getElementById('carrito-overlay')?.classList.remove('abierto');
  document.getElementById('carrito-panel')?.classList.remove('abierto');
  document.body.style.overflow = '';
}

function iniciarBotonCheckout() {
  document.querySelectorAll('.btn-checkout').forEach(boton => {
    boton.onclick = null;
    boton.addEventListener('click', () => {
      const ok = registrarCompra();
      if (ok) abrirModalHistorial();
    });
  });
}

function mostrarToast(mensaje, icono = '✅') {
  const contenedor = document.getElementById('contenedor-toast');
  if (!contenedor) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-icono">${icono}</span><span class="toast-texto">${mensaje}</span>`;
  contenedor.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('eliminando');
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

function iniciarNavbar() {
  const barraNav = document.querySelector('.barra-nav');
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  if (barraNav) {
    const alScroll = () => barraNav.classList.toggle('con-scroll', window.scrollY > 20);
    window.addEventListener('scroll', alScroll, { passive: true });
    alScroll();
  }
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('abierto');
      menu.classList.toggle('menu-movil-abierto');
    });
    menu.querySelectorAll('.nav-enlace').forEach(enlace => {
      enlace.addEventListener('click', () => {
        toggle.classList.remove('abierto');
        menu.classList.remove('menu-movil-abierto');
      });
    });
  }
  const ruta = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-enlace').forEach(enlace => {
    const href = (enlace.getAttribute('href') || '').split('#')[0];
    if (!href) return;
    if (href === ruta || (ruta === '' && href === 'index.html')) enlace.classList.add('activo');
  });
}

function iniciarAnimaciones() {
  const observer = new IntersectionObserver(entradas => {
    entradas.forEach(entrada => {
      if (!entrada.isIntersecting) return;
      entrada.target.classList.add('visible');
      observer.unobserve(entrada.target);
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.subir-fade, .hijos-escalonados').forEach(el => observer.observe(el));
}

function obtenerIndiceImagenProducto(idProducto) {
  if (!indicesImagenes.has(idProducto)) indicesImagenes.set(idProducto, 0);
  return indicesImagenes.get(idProducto);
}

function establecerIndiceImagenProducto(idProducto, indice) {
  indicesImagenes.set(idProducto, indice);
}

function renderizarMediaProducto(producto) {
  const imagenes = obtenerImagenesProducto(producto.id);
  if (!imagenes.length) {
    return `<div class="tarjeta-producto-img">${producto.emoji}</div>`;
  }
  const indiceActual = obtenerIndiceImagenProducto(producto.id) % imagenes.length;
  const tieneMultiples = imagenes.length > 1;
  return `
    <div class="tarjeta-producto-img tarjeta-producto-media" data-producto-id="${producto.id}">
      <img class="producto-media-img" src="${imagenes[indiceActual]}" alt="${producto.nombre}" loading="lazy" onerror="this.remove()" />
      ${tieneMultiples ? `
        <button class="nav-multimedia nav-multimedia-anterior" onclick="cambiarImagenProducto(${producto.id}, -1, event)" aria-label="Foto anterior">‹</button>
        <button class="nav-multimedia nav-multimedia-siguiente" onclick="cambiarImagenProducto(${producto.id}, 1, event)" aria-label="Foto siguiente">›</button>
      ` : ''}
    </div>`;
}

function construirTarjetaProducto(producto) {
  const badgeHtml = producto.badge
    ? `<span class="tarjeta-producto-badge ${producto.badge}">${producto.badge === 'oferta' ? 'Oferta' : 'Nuevo'}</span>`
    : '';
  const precioOriginalHtml = producto.precioOriginal
    ? `<span class="precio-original">$${producto.precioOriginal.toLocaleString()}</span>`
    : '';
  const estrellas = '★'.repeat(Math.floor(producto.calificacion));
  return `
    <div class="tarjeta-producto subir-fade" data-id="${producto.id}">
      ${badgeHtml}
      ${renderizarMediaProducto(producto)}
      <div class="tarjeta-producto-cuerpo">
        <span class="tarjeta-producto-cat">${obtenerEtiquetaCategoria(producto.categoria)}</span>
        <div class="tarjeta-producto-nombre">${producto.nombre}</div>
        <div class="tarjeta-producto-calificacion">
          <span class="estrellas">${estrellas}</span>
          <span class="cantidad-resenas">(${producto.resenas})</span>
        </div>
        <div class="tarjeta-producto-pie">
          <div class="tarjeta-producto-precio">
            <span class="precio-actual">$${producto.precio.toLocaleString()}</span>
            ${precioOriginalHtml}
          </div>
          <div class="tarjeta-producto-acciones">
            <button class="btn-detalle btn btn-sm" onclick="window.location.href='productos.html'">Ver más</button>
            <button class="btn-carrito" onclick="agregarAlCarrito(${producto.id})" title="Agregar al carrito">🛒</button>
          </div>
        </div>
      </div>
    </div>`;
}

function cambiarImagenProducto(idProducto, direccion, evento) {
  if (evento) evento.stopPropagation();
  const imagenes = obtenerImagenesProducto(idProducto);
  if (imagenes.length <= 1) return;
  const actual = obtenerIndiceImagenProducto(idProducto);
  let siguiente = actual + direccion;
  if (siguiente < 0) siguiente = imagenes.length - 1;
  if (siguiente >= imagenes.length) siguiente = 0;
  establecerIndiceImagenProducto(idProducto, siguiente);
  const media = document.querySelector(`.tarjeta-producto-media[data-producto-id="${idProducto}"]`);
  if (!media) return;
  const img = media.querySelector('.producto-media-img');
  if (img) img.src = imagenes[siguiente];
}

function renderizarProductosDestacados() {
  const grilla = document.getElementById('grilla-destacados');
  if (!grilla) return;
  const destacados = PRODUCTOS_UI.filter(producto => producto.badge).slice(0, 8);
  grilla.innerHTML = destacados.map(construirTarjetaProducto).join('');
  iniciarAnimaciones();
}

function iniciarImagenesHeroFlotantes() {
  const tarjetas = document.querySelectorAll('.hero-visual .tarjeta-dispositivo[data-producto-id]');
  if (!tarjetas.length) return;
  tarjetas.forEach(tarjeta => {
    const id = parseInt(tarjeta.dataset.productoId, 10);
    if (!id) return;
    const contenedorImg = tarjeta.querySelector('.tarjeta-dispositivo-img');
    const fallback = tarjeta.querySelector('.tarjeta-dispositivo-fallback');
    if (!contenedorImg) return;
    const imagenes = obtenerImagenesProducto(id);
    if (!imagenes.length) return;
    const img = document.createElement('img');
    img.src = imagenes[0];
    img.alt = 'Producto destacado';
    img.loading = 'lazy';
    img.onerror = () => {
      img.remove();
      if (fallback) fallback.style.display = 'grid';
    };
    contenedorImg.prepend(img);
    if (fallback) fallback.style.display = 'none';
  });
}

function renderizarProductos() {
  const grilla = document.getElementById('grilla-productos');
  if (!grilla) return;
  let filtrados = PRODUCTOS_UI.filter(producto => {
    const porBusqueda = producto.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase());
    const porCategoria = filtros.categoria === 'todos' || producto.categoria === filtros.categoria;
    const porPrecio = producto.precio <= filtros.precioMax;
    return porBusqueda && porCategoria && porPrecio;
  });
  if (filtros.orden === 'precio-asc') filtrados = filtrados.sort((a, b) => a.precio - b.precio);
  if (filtros.orden === 'precio-desc') filtrados = filtrados.sort((a, b) => b.precio - a.precio);
  if (filtros.orden === 'calificacion') filtrados = filtrados.sort((a, b) => b.calificacion - a.calificacion);
  const elementoCantidad = document.getElementById('productos-cantidad');
  if (elementoCantidad) elementoCantidad.innerHTML = `<strong>${filtrados.length}</strong> productos encontrados`;
  if (!filtrados.length) {
    grilla.innerHTML = `
      <div class="sin-resultados">
        <span class="sin-resultados-icono">🔍</span>
        <h3>Sin resultados</h3>
        <p>Probá con otros filtros o términos de búsqueda</p>
      </div>`;
    return;
  }
  grilla.innerHTML = filtrados.map(construirTarjetaProducto).join('');
  iniciarAnimaciones();
}

function actualizarContadoresCategoria() {
  const categorias = ['todos', 'celulares', 'notebooks', 'tablets', 'accesorios', 'gaming'];
  categorias.forEach(cat => {
    let cantidad = 0;
    if (cat === 'todos') {
      cantidad = PRODUCTOS_UI.length;
    } else {
      cantidad = PRODUCTOS_UI.filter(p => p.categoria === cat).length;
    }
    const chip = document.querySelector(`.chip-categoria[data-cat="${cat}"] .chip-categoria-cantidad`);
    if (chip) chip.textContent = cantidad;
  });
}

function iniciarPaginaProductos() {
  actualizarContadoresCategoria();
  const inputBusqueda = document.getElementById('filtro-busqueda');
  if (inputBusqueda) {
    inputBusqueda.addEventListener('input', evento => {
      filtros.busqueda = evento.target.value;
      renderizarProductos();
    });
  }
  document.querySelectorAll('.chip-categoria').forEach(chip => {
    chip.addEventListener('click', () => {
      filtros.categoria = chip.dataset.cat || 'todos';
      document.querySelectorAll('.chip-categoria').forEach(item => item.classList.remove('activo'));
      chip.classList.add('activo');
      renderizarProductos();
    });
  });
  const rangoPrecios = document.getElementById('precio-rango');
  const displayPrecio = document.getElementById('precio-display');
  if (rangoPrecios && displayPrecio) {
    rangoPrecios.addEventListener('input', evento => {
      filtros.precioMax = parseInt(evento.target.value, 10);
      displayPrecio.textContent = `$${filtros.precioMax.toLocaleString()}`;
      renderizarProductos();
    });
  }
  const selectOrden = document.getElementById('select-orden');
  if (selectOrden) {
    selectOrden.addEventListener('change', evento => {
      filtros.orden = evento.target.value;
      renderizarProductos();
    });
  }
  const botonLimpiar = document.getElementById('filtros-limpiar');
  if (botonLimpiar) {
    botonLimpiar.addEventListener('click', () => {
      filtros = { busqueda: '', categoria: 'todos', precioMax: 2500, orden: 'default' };
      if (inputBusqueda) inputBusqueda.value = '';
      if (rangoPrecios) rangoPrecios.value = 2500;
      if (displayPrecio) displayPrecio.textContent = '$2,500';
      if (selectOrden) selectOrden.value = 'default';
      document.querySelectorAll('.chip-categoria').forEach(item => item.classList.remove('activo'));
      document.querySelector('.chip-categoria[data-cat="todos"]')?.classList.add('activo');
      renderizarProductos();
    });
  }
  const grilla = document.getElementById('grilla-productos');
  document.querySelectorAll('.btn-vista').forEach(boton => {
    boton.addEventListener('click', () => {
      document.querySelectorAll('.btn-vista').forEach(item => item.classList.remove('activo'));
      boton.classList.add('activo');
      if (!grilla) return;
      grilla.style.gridTemplateColumns = boton.dataset.vista === 'lista' ? '1fr' : '';
    });
  });
  const catGuardada = localStorage.getItem('nst_filtro_cat');
  if (catGuardada) {
    localStorage.removeItem('nst_filtro_cat');
    filtros.categoria = catGuardada;
    document.querySelectorAll('.chip-categoria').forEach(item => item.classList.remove('activo'));
    document.querySelector(`.chip-categoria[data-cat="${catGuardada}"]`)?.classList.add('activo');
  }
  renderizarProductos();
}

function iniciarTarjetasCategorias() {
  document.querySelectorAll('.tarjeta-categoria[data-cat]').forEach(tarjeta => {
    tarjeta.addEventListener('click', () => {
      localStorage.setItem('nst_filtro_cat', tarjeta.dataset.cat || 'todos');
      window.location.href = 'productos.html';
    });
  });
}

function actualizarCantidadesCategoriasInicio() {
  document.querySelectorAll('.tarjeta-categoria[data-cat]').forEach(tarjeta => {
    const categoria = tarjeta.dataset.cat;
    if (!categoria) return;
    const cantidad = PRODUCTOS_UI.filter(producto => producto.categoria === categoria).length;
    const cantidadEl = tarjeta.querySelector('.categoria-cantidad');
    if (!cantidadEl) return;
    cantidadEl.textContent = `${cantidad} ${cantidad === 1 ? 'producto' : 'productos'}`;
  });
}

const suscriptores = JSON.parse(localStorage.getItem('suscriptores')) || [];

function iniciarNewsletter() {
  const formulario = document.getElementById('newsletter-formulario');
  if (!formulario) return;
  formulario.addEventListener('submit', evento => {
    evento.preventDefault();
    const input = formulario.querySelector('input[type="email"]');
    if (!input || !input.value) return;
    if (suscriptores.includes(input.value)) {
      mostrarToast(`El email <strong>${input.value}</strong> ya está suscripto`, '⚠️');
      input.value = '';
      return;
    }
    mostrarToast(`Suscripción confirmada para <strong>${input.value}</strong>`, '🎉');
    suscriptores.push(input.value);
    localStorage.setItem('suscriptores', JSON.stringify(suscriptores));
    input.value = '';
  });
}

window.agregarAlCarrito = agregarAlCarrito;
window.cambiarCantidad = cambiarCantidad;
window.eliminarDelCarrito = eliminarDelCarrito;
window.mostrarToast = mostrarToast;
window.cambiarImagenProducto = cambiarImagenProducto;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await cargarDatosIniciales();
    inicializarMapaImagenes();
    cargarCarrito();
    cargarSesion();
    iniciarNavbar();
    iniciarMenuUsuario();
    iniciarAnimaciones();
    iniciarImagenesHeroFlotantes();
    actualizarUICarrito();
    renderizarProductosDestacados();
    actualizarCantidadesCategoriasInicio();
    iniciarTarjetasCategorias();
    iniciarNewsletter();
    iniciarBotonCheckout();
    document.getElementById('carrito-btn-abrir')?.addEventListener('click', abrirCarrito);
    document.getElementById('carrito-btn-cerrar')?.addEventListener('click', cerrarCarrito);
    document.getElementById('carrito-overlay')?.addEventListener('click', cerrarCarrito);
    if (document.getElementById('grilla-productos')) iniciarPaginaProductos();
    document.getElementById('hero-cta')?.addEventListener('click', () => {
      window.location.href = 'productos.html';
    });
  } catch (error) {
    console.error('Error al inicializar la tienda:', error);
  }
});