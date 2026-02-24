import { Producto } from "./producto.js";

let productos = [
    new Producto("Laptop Dell XPS 13", 1299.99, 5, "Computadoras", 1),
    new Producto("Mouse Logitech MX Master 3", 99.99, 15, "Periféricos", 2),
    new Producto("Monitor Samsung 4K 27", 499.99, 8, "Monitores", 3),
    new Producto("Teclado Mecánico Corsair K95", 199.99, 12, "Periféricos", 4),
    new Producto("Auriculares Sony WH-1000XM5", 379.99, 20, "Audio", 5),
    new Producto("Webcam Logitech C920", 79.99, 25, "Accesorios", 6),
    new Producto("Notebook Lenovo ThinkPad X1", 999.99, 30, "Computadoras", 7),
    new Producto("SSD Samsung 970 EVO 1TB", 149.99, 18, "Almacenamiento", 8),
    new Producto("Notebook ASUS ZenBook 14", 799.99, 10, "Computadoras", 9),
    new Producto("Monitor Curvo LG 34\"", 699.99, 4, "Monitores", 10),
    new Producto("Tarjeta Gráfica NVIDIA RTX 4070", 599.99, 3, "Componentes", 11),
]

function buscarProducto(id){
    return productos.find(producto => producto.id === id);
}

function agregarProducto(producto){
    productos.push(producto);
}

function eliminarProducto(id){
    productos = productos.filter(producto => producto.id !== id);
}

function actualizarProducto(id, nuevoProducto){
    const index = productos.findIndex(producto => producto.id === id);
    if (index !== -1) {
        productos[index] = nuevoProducto;
    }
}

let carrito = [];

function agregarAlCarrito(id, cantidad){
    if (carrito[id]) {
        carrito[id] += cantidad;  
    } else {
        carrito[id] = cantidad;   
    }
}

function eliminarDelCarrito(id){
    if (carrito[id]) {
        delete carrito[id];
    }
}

function calcularTotalCarrito(){
    return carrito.reduce((total, cantidad, id) => {
        if (!cantidad) return total;
        const producto = buscarProducto(id);
        return total + (producto ? producto.precio * cantidad : 0);
    }, 0);
}

function finalizarCompra(){
    carrito.forEach((cantidad, id) => {
        if (!cantidad) return;
        const index = productos.findIndex(p => p.id === id);
        if (index !== -1) {
            productos[index].stock -= cantidad;
        }
    });
    const total = calcularTotalCarrito();
    carrito = [];
    return total;
}

function vaciarCarrito(){
    carrito = [];
}

document.addEventListener("DOMContentLoaded", () => {
    let opcion;
    do {
        opcion = prompt("Bienvenido a la tienda online. ¿Qué deseas hacer?\n1. Ver productos\n2. Agregar producto al carrito\n3. Eliminar producto del carrito\n4. Ver carrito\n5. Vaciar carrito\n6. Finalizar compra\n7. Salir");
        switch (opcion) {
            case "1":
                alert(productos.map(p => `${p.id}. ${p.nombre} - $${p.precio} (Stock: ${p.stock})`).join("\n"));
                break;
            case "2":
                const idAgregar = parseInt(prompt("Ingrese el ID del producto que desea agregar al carrito:"));
                const cantidadAgregar = parseInt(prompt("Ingrese la cantidad:"));
                if(!buscarProducto(idAgregar)) { alert ("Producto no encontrado."); break; }
                else if(cantidadAgregar > buscarProducto(idAgregar).stock) { alert ("No hay suficiente stock."); break; }
                agregarAlCarrito(idAgregar, cantidadAgregar);
                alert("Producto agregado al carrito.");
                break;
            case "3":
                const idEliminar = parseInt(prompt("Ingrese el ID del producto que desea eliminar del carrito:"));
                if(!buscarProducto(idEliminar)) { alert ("Producto no encontrado."); break; }
                eliminarDelCarrito(idEliminar);
                alert("Producto eliminado del carrito.");
                break;
            case "4":
                const detalleCarrito = carrito
                    .map((cantidad, id) => {
                        if (!cantidad) return null;
                        const producto = buscarProducto(id);
                        if (!producto) return null;
                        return `${producto.nombre} - Cantidad: ${cantidad} - Subtotal: $${producto.precio * cantidad}`;
                    })
                    .filter(item => item !== null);

                if (detalleCarrito.length === 0) {
                    alert("El carrito está vacío.");
                } else {
                    let formateado = calcularTotalCarrito().toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                    });
                    alert(detalleCarrito.join("\n") + `\nTotal: $${formateado}`);
                }
                break;
            case "5":
                vaciarCarrito();
                alert("Carrito vaciado.");
                break;
            case "6":
                let detalle = "";
                carrito.forEach((cantidad, id) => {
                    detalle += `${buscarProducto(id).nombre} - Cantidad: ${cantidad} - Subtotal: $${buscarProducto(id).precio * cantidad}\n`;
                });
                const totalCompra = finalizarCompra();
                alert(`Compra finalizada. Detalle:\n${detalle}\nTotal a pagar: $${totalCompra.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}`);
                vaciarCarrito();
                break;
            case "7":
                alert("Gracias por visitar nuestra tienda. ¡Hasta luego!");
                break;
            default:
                alert("Opción no válida. Por favor, elige una opción del 1 al 7.");
                break;
        }
    } while (opcion !== null && opcion !== "7");
});


