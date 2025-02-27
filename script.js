// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    cargarProgreso();
    actualizarListaEstadisticas();
    configurarNotificaciones();
    inicializarEventListeners();
    verificarDatosIniciales();
});

// Utilidades básicas
function esNumeroValido(valor) {
    return !isNaN(valor) && valor >= 0;
}

function escaparHTML(texto) {
    const div = document.createElement('div');
    div.innerText = texto;
    return div.innerHTML;
}

function mostrarMensaje(icono, mensaje, tipo = 'info') {
    const resultado = document.getElementById('resultado');
    if (resultado) {
        resultado.className = `result ${tipo}`; // Añade clase para estilos
        resultado.innerHTML = `<i class="fas ${icono}"></i> ${mensaje}`;
    }
}

// Sistema de notificaciones
function configurarNotificaciones() {
    if (!("Notification" in window)) return;
    
    Notification.requestPermission().then(function(permission) {
        if (permission === "granted") {
            establecerRecordatorioAhorro();
        }
    });
}

function establecerRecordatorioAhorro() {
    const intervalo = 24 * 60 * 60 * 1000;
    setInterval(() => {
        const ultimoAhorro = obtenerUltimoAhorro();
        if (Date.now() - new Date(ultimoAhorro.fecha).getTime() > intervalo) {
            new Notification("Recordatorio de ahorro", {
                body: "¡No olvides registrar tu ahorro diario!",
                icon: "path-to-icon.png"
            });
        }
    }, intervalo);
}

// Gestión de menús
function mostrarMenu(tipo) {
    const menuExportar = document.getElementById('menuExportar');
    const menuImportar = document.getElementById('menuImportar');
    menuExportar.style.display = (tipo === 'exportar') ? 'block' : 'none';
    menuImportar.style.display = (tipo === 'importar') ? 'block' : 'none';
}

// Gestión de la barra de progreso
function actualizarProgressBar(valor) {
    const metaAhorroInput = document.getElementById("metaAhorroInput");
    const progressBar = document.getElementById('progressBar');
    const metaAhorroTexto = document.getElementById("metaAhorroTexto");
    const metaAhorro = parseFloat(metaAhorroInput?.value) || 0;

    if (!progressBar || metaAhorro <= 0) {
        console.error("Elemento de barra de progreso o meta no válidos.");
        return;
    }

    const porcentaje = Math.min((valor / metaAhorro) * 100, 100);
    progressBar.style.width = `${porcentaje}%`;
    progressBar.setAttribute('data-progress', Math.round(porcentaje));

    if (metaAhorroTexto) {
        metaAhorroTexto.textContent = porcentaje >= 100
            ? "¡Meta alcanzada!"
            : `Falta: $${(metaAhorro - valor).toFixed(2)}`;
    }
}

// Manejo de ahorros mejorado
function manejarAhorro(isAddition) {
    const ahorroInput = document.getElementById('ahorro');
    const nuevoAhorroInput = document.getElementById('nuevoAhorro');
    const metaAhorroInput = document.getElementById('metaAhorroInput');
    
    const nuevoAhorro = parseFloat(nuevoAhorroInput.value);
    
    if (!esNumeroValido(nuevoAhorro) || nuevoAhorro <= 0) {
        mostrarMensaje('fa-exclamation-triangle', 'Por favor ingresa una cantidad válida.', 'error');
        return;
    }
    
    const ahorroActual = parseFloat(ahorroInput.value) || 0;
    const nuevaMeta = parseFloat(metaAhorroInput.value) || 0;
    
    if (nuevaMeta <= 0) {
        mostrarMensaje('fa-exclamation-triangle', 'Por favor establece una meta de ahorro válida.', 'error');
        return;
    }
    
    const nuevoTotal = isAddition ? 
        (ahorroActual + nuevoAhorro) : 
        Math.max(ahorroActual - nuevoAhorro, 0);
    
    ahorroInput.value = nuevoTotal.toFixed(2);
    actualizarProgressBar(nuevoTotal);
    
    const mensaje = isAddition ? 
        `Has añadido $${nuevoAhorro.toFixed(2)} a tus ahorros.` :
        `Has retirado $${nuevoAhorro.toFixed(2)} de tus ahorros.`;
    
    mostrarMensaje('fa-info-circle', mensaje, 'success');
    guardarEnEstadisticas(nuevoTotal, isAddition ? 'depósito' : 'retiro');
    nuevoAhorroInput.value = '';
    guardarProgreso();
}

// Gestión de estadísticas
function guardarEnEstadisticas(ahorro, tipo = 'actualización') {
    const estadisticas = JSON.parse(localStorage.getItem('estadisticas')) || [];
    const entrada = {
        ahorro,
        tipo,
        fecha: new Date().toISOString()
    };
    
    // Verificar si es una actualización válida
    if (tipo === 'actualización' && estadisticas.length > 0) {
        const ultimaEntrada = estadisticas[estadisticas.length - 1];
        if (Math.abs(ahorro - ultimaEntrada.ahorro) < 0.01) {
            mostrarMensaje('fa-exclamation-triangle', 'No se registran cambios significativos.', 'warning');
            return;
        }
    }
    
    estadisticas.push(entrada);
    localStorage.setItem('estadisticas', JSON.stringify(estadisticas));
    actualizarListaEstadisticas();
}

function actualizarListaEstadisticas() {
    const estadisticas = JSON.parse(localStorage.getItem('estadisticas')) || [];
    const lista = document.getElementById('estadisticasList');
    if (!lista) return;
    
    lista.innerHTML = '';
    
    estadisticas.slice(-10).reverse().forEach((item, index) => {
        const li = document.createElement('li');
        const fecha = new Date(item.fecha);
        
        const diferencia = index < estadisticas.length - 1 ?
            item.ahorro - estadisticas[estadisticas.length - 2 - index].ahorro :
            null;
        
        const icono = diferencia > 0 ? 'fa-arrow-up' :
                     diferencia < 0 ? 'fa-arrow-down' :
                     'fa-equals';
        
        li.innerHTML = `
            <span>
                <i class="fas ${icono}"></i>
                ${diferencia ? `$${Math.abs(diferencia).toFixed(2)}` : "Inicio"}
                <small>(${item.tipo})</small>
            </span>
            <small>${fecha.toLocaleDateString('es-ES', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</small>
            <span class="total">$${item.ahorro.toFixed(2)}</span>
        `;
        
        lista.appendChild(li);
    });
}

// Gestión de almacenamiento
function guardarProgreso() {
    const ahorroInput = document.getElementById('ahorro');
    const metaAhorroInput = document.getElementById('metaAhorroInput');
    
    if (ahorroInput && metaAhorroInput) {
        const datos = {
            ahorro: parseFloat(ahorroInput.value) || 0,
            meta: parseFloat(metaAhorroInput.value) || 0
        };
        localStorage.setItem('ahorro', JSON.stringify(datos));
        mostrarMensaje('fa-check-circle', 'Progreso guardado correctamente.');
    }
}

function cargarProgreso() {
    const datos = JSON.parse(localStorage.getItem('ahorro'));
    if (!datos) {
        mostrarMensaje('fa-exclamation-triangle', 'No hay datos guardados');
        return;
    }

    const ahorroInput = document.getElementById('ahorro');
    const metaAhorroInput = document.getElementById('metaAhorroInput');
    const metaAhorroTexto = document.getElementById('metaAhorroTexto');

    if (ahorroInput) ahorroInput.value = datos.ahorro || 0;
    if (metaAhorroInput) metaAhorroInput.value = datos.meta || 0;
    if (metaAhorroTexto) {
        metaAhorroTexto.textContent = `Falta: $${(datos.meta - datos.ahorro).toFixed(2)}`;
    }

    actualizarProgressBar(datos.ahorro);
    actualizarListaEstadisticas();
    mostrarMensaje('fa-sync-alt', `Datos cargados: ${new Date().toLocaleDateString('es-ES')}`);
}

function eliminarGuardado() {
    if (confirm('¿Estás seguro de que deseas eliminar todo tu progreso guardado?')) {
        localStorage.removeItem('ahorro');
        localStorage.removeItem('estadisticas');
        localStorage.removeItem('ultimo_backup');

        // Limpia la interfaz
        ['ahorro', 'metaAhorroInput', 'nuevoAhorro'].forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) elemento.value = '';
        });

        const listaEstadisticas = document.getElementById('estadisticasList');
        if (listaEstadisticas) listaEstadisticas.innerHTML = '';

        const progressBar = document.getElementById('progressBar');
        if (progressBar) progressBar.style.width = '0%';

        const resultado = document.getElementById('resultado');
        if (resultado) resultado.textContent = 'Ingresa tu primer ahorro para comenzar.';

        // Muestra el formulario inicial nuevamente
        document.getElementById('modalInicial').style.display = 'flex';
    }
}

function exportarJSON() {
    try {
        const ahorro = parseFloat(document.getElementById('ahorro').value) || 0;
        const metaAhorro = parseFloat(document.getElementById('metaAhorroInput').value) || 0;
        const estadisticas = JSON.parse(localStorage.getItem('estadisticas')) || [];
        
        const datos = {
            ahorro,
            metaAhorro,
            estadisticas,
            fechaExportacion: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `exportar_ahorros_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();

        mostrarMensaje('fa-check-circle', 'Exportación completada correctamente.');
    } catch (error) {
        console.error("Error al exportar datos:", error);
        mostrarMensaje('fa-exclamation-circle', 'Error al exportar los datos.');
    }
}

function importarJSON() {
    const archivo = document.getElementById('importarArchivo')?.files[0];

    if (!archivo) {
        mostrarMensaje('fa-exclamation-triangle', 'Selecciona un archivo válido para importar.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const datos = JSON.parse(event.target.result);
            if (!datos.ahorro || !datos.metaAhorro) {
                throw new Error('Datos incompletos en el archivo.');
            }

            // Guardar datos en localStorage
            localStorage.setItem('ahorro', JSON.stringify({ ahorro: datos.ahorro, meta: datos.metaAhorro }));
            localStorage.setItem('estadisticas', JSON.stringify(datos.estadisticas || []));

            // Actualizar interfaz
            cargarProgreso();
            mostrarMensaje('fa-check-circle', 'Importación completada correctamente.');
        } catch (error) {
            console.error("Error al importar datos:", error);
            mostrarMensaje('fa-exclamation-triangle', 'Error al procesar el archivo JSON.');
        }
    };

    reader.readAsText(archivo);
}


function procesarDatosImportados(contenidoJSON) {
    try {
        const datos = JSON.parse(contenidoJSON);
        if (datos.ahorro === undefined || datos.metaAhorro === undefined) {
            throw new Error('Datos incompletos: Ahorro o Meta de Ahorro faltante');
        }

        // Almacenamiento de datos en localStorage
        localStorage.setItem('ahorro', JSON.stringify(datos));
        localStorage.setItem('estadisticas', JSON.stringify(datos.estadisticas || []));
        localStorage.setItem("metaAhorro", JSON.stringify(datos.metaAhorro));

        // Verificación si el elemento existe antes de acceder a su estilo
        const barraProgreso = document.getElementById('barraProgreso');
        if (barraProgreso) {
            const progresoPorcentaje = ((datos.ahorro / datos.metaAhorro) * 100).toFixed(2);
            barraProgreso.style.width = progresoPorcentaje + '%';
            document.getElementById('porcentajeProgreso').innerText = progresoPorcentaje + '%';
        }

        cerrarVentanaImportar();
        mostrarMensaje('fa-check', 'Datos importados correctamente');
    } catch (e) {
        mostrarMensaje('fa-exclamation-triangle', `Error al procesar el archivo JSON: ${e.message}`);
        console.error(e);
    }
}

// Gestión de ventanas
function cerrarVentanaImportar() {
    document.getElementById('menuImportar').style.display = 'none';
    document.getElementById('importarArchivo').value = '';
    document.getElementById('jsonImportar').value = '';
}

function cerrarVentanaExportar() {
    document.getElementById('menuExportar').style.display = 'none';
}

// Event Listeners
function inicializarEventListeners() {
    const metaAhorroInput = document.getElementById('metaAhorroInput');
    if (metaAhorroInput) {
        metaAhorroInput.addEventListener('input', actualizarMetaAhorro);
    }
}

function actualizarMetaAhorro() {
    const metaAhorroInput = document.getElementById('metaAhorroInput');
    const ahorroActual = parseFloat(document.getElementById('ahorro').value) || 0;
    const metaAhorro = parseFloat(metaAhorroInput.value) || 0;

    if (metaAhorro > 0) {
        // Cálculo del porcentaje de progreso
        let progreso = (ahorroActual / metaAhorro) * 100;
        progreso = Math.min(progreso, 100); // Asegura que no supere el 100%

        // Actualiza la barra de progreso
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = `${progreso}%`; // Ancho de la barra
            progressBar.setAttribute('data-progress', Math.round(progreso)); // Atributo de progreso
        }

        // Actualiza el texto del resultado
        const resultado = document.getElementById('resultado');
        if (resultado) {
            resultado.textContent = progreso >= 100 
                ? '¡Felicidades! Has alcanzado tu meta de ahorro.' 
                : `Progreso: ${progreso.toFixed(2)}%`; // Formatea el porcentaje

            // Cambia el estilo si se alcanza el 100%
            if (progreso >= 100) {
                resultado.classList.add('complete');
            } else {
                resultado.classList.remove('complete');
            }
        }

        // Actualiza el texto debajo del input de meta (meta restante)
        const metaAhorroTexto = document.getElementById('metaAhorroTexto');
        if (metaAhorroTexto) {
            const cantidadRestante = metaAhorro - ahorroActual;
            metaAhorroTexto.textContent = cantidadRestante > 0
                ? `Falta: $${cantidadRestante.toFixed(2)}`
                : "¡Meta cumplida!";
        }

    } else {
        console.error('Meta de ahorro no válida.');
        const resultado = document.getElementById('resultado');
        if (resultado) {
            resultado.textContent = 'Por favor, introduce una meta de ahorro válida.';
            resultado.classList.remove('complete');
        }
    }
}

// Sistema de etiquetas
function agregarEtiqueta(indice, etiqueta) {
    const estadisticas = JSON.parse(localStorage.getItem('estadisticas')) || [];
    if (estadisticas[indice]) {
        estadisticas[indice].etiqueta = etiqueta;
        localStorage.setItem('estadisticas', JSON.stringify(estadisticas));
        actualizarListaEstadisticas();
    }
}

// Funciones de ayuda
function obtenerUltimoAhorro() {
    const estadisticas = JSON.parse(localStorage.getItem('estadisticas')) || [];
    return estadisticas[estadisticas.length - 1] || { fecha: new Date() };
}

// Funciones de validación
function validarDatos(datos) {
    return datos && 
           typeof datos === 'object' &&
           !isNaN(datos.ahorro) &&
           !isNaN(datos.meta) &&
           datos.ahorro >= 0 &&
           datos.meta >= 0;
}

// Sistema de respaldo automático
function configurarBackupAutomatico() {
    setInterval(() => {
        const ultimoBackup = localStorage.getItem('ultimo_backup');
        if (!ultimoBackup || Date.now() - new Date(ultimoBackup).getTime() > 86400000) {
            guardarProgreso();
            localStorage.setItem('ultimo_backup', new Date().toISOString());
        }
    }, 3600000); // Verificar cada hora
}

// Funciones de formateo
function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
    }).format(valor);
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Inicialización de la aplicación
window.addEventListener('load', () => {
    configurarBackupAutomatico();
    inicializarEventListeners();
    cargarProgreso();

    // Agregar event listener al input de metaAhorro para actualizar el progress bar
    const metaAhorroInput = document.getElementById('metaAhorroInput');
    if (metaAhorroInput) {
        metaAhorroInput.addEventListener('input', actualizarMetaAhorro);
    }
});

function guardarDatosIniciales() {
    const metaInicial = parseFloat(document.getElementById('metaInicial').value) || 0;
    const ahorroInicial = parseFloat(document.getElementById('ahorroInicial').value) || 0;

    if (metaInicial > 0 && ahorroInicial >= 0) {
        // Guardar en localStorage
        localStorage.setItem('ahorro', JSON.stringify({ ahorro: ahorroInicial, meta: metaInicial }));
        localStorage.setItem('estadisticas', JSON.stringify([{ ahorro: ahorroInicial, fecha: new Date().toISOString() }]));

        // Actualizar la interfaz
        document.getElementById('ahorro').value = ahorroInicial.toFixed(2);
        document.getElementById('metaAhorroInput').value = metaInicial.toFixed(2);

        // Cerrar el modal
        document.getElementById('modalInicial').style.display = 'none';
        actualizarMetaAhorro();
    } else {
        alert('Por favor, ingresa valores válidos.');
    }
}


// Manejo de errores global
window.onerror = function(mensaje, archivo, linea, columna, error) {
    console.error('Error en la aplicación:', {
        mensaje,
        archivo,
        linea,
        columna,
        error
    });
    
    mostrarMensaje('fa-exclamation-circle', 
        'Ha ocurrido un error. Por favor, recarga la página o contacta soporte.');
    
    return false;
};

function habilitarEdicion(campoId) {
    const campo = document.getElementById(campoId);
    const boton = document.getElementById('editarAhorroBtn');
    const valorOriginal = campo.value;
    
    if (campo.readOnly) {
        campo.readOnly = false;
        campo.dataset.original = valorOriginal;
        boton.innerHTML = '<i class="fas fa-check"></i>';
        campo.focus();
        boton.onclick = () => guardarEdicion(campoId);
    }
}

function guardarEdicion(campoId) {
    const campo = document.getElementById(campoId);
    const boton = document.getElementById('editarAhorroBtn');
    const nuevoValor = parseFloat(campo.value);
    const valorOriginal = parseFloat(campo.dataset.original);
    
    if (!esNumeroValido(nuevoValor)) {
        mostrarMensaje('fa-exclamation-triangle', 'Por favor ingresa un valor válido.', 'error');
        campo.value = valorOriginal;
        campo.readOnly = true;
        boton.innerHTML = '<i class="fas fa-edit"></i>';
        boton.onclick = () => habilitarEdicion(campoId);
        return;
    }
    
    if (Math.abs(nuevoValor - valorOriginal) < 0.01) {
        mostrarMensaje('fa-info-circle', 'No se detectaron cambios en el valor.', 'info');
        campo.readOnly = true;
        boton.innerHTML = '<i class="fas fa-edit"></i>';
        boton.onclick = () => habilitarEdicion(campoId);
        return;
    }
    
    // Guardar el nuevo valor
    const datos = JSON.parse(localStorage.getItem('ahorro')) || {};
    datos.ahorro = nuevoValor;
    localStorage.setItem('ahorro', JSON.stringify(datos));
    
    // Actualizar estadísticas con el tipo correcto
    guardarEnEstadisticas(nuevoValor, 'ajuste manual');
    
    campo.readOnly = true;
    boton.innerHTML = '<i class="fas fa-edit"></i>';
    boton.onclick = () => habilitarEdicion(campoId);
    
    actualizarMetaAhorro();
    mostrarMensaje('fa-check-circle', 'Valor actualizado correctamente.', 'success');
}

function actualizarBotonPrincipal() {
    const botonPrincipal = document.getElementById('botonPrincipal');
    if (!botonPrincipal) return;
    
    const hayDatos = Boolean(localStorage.getItem('ahorro'));
    
    botonPrincipal.innerHTML = hayDatos ? 
        '<i class="fas fa-trash"></i> Borrar' : 
        '<i class="fas fa-plus"></i> Nuevo';
    
    botonPrincipal.onclick = hayDatos ? eliminarGuardado : mostrarModalInicial;
}

function mostrarModalInicial() {
    const modal = document.getElementById('modalInicial');
    modal.querySelector('.modal-content').innerHTML = `
        <h2>Configura tus objetivos</h2>
        <form id="configuracionInicial">
            <div class="form-group">
                <label for="metaInicial">Meta de Ahorro ($)</label>
                <input type="number" id="metaInicial" min="1" step="0.01" placeholder="100.00" required>
            </div>
            <div class="form-group">
                <label for="ahorroInicial">Ahorro Actual ($)</label>
                <input type="number" id="ahorroInicial" min="0" step="0.01" placeholder="0.00" required>
            </div>
            <div class="button-group">
                <button type="button" class="primary-btn" onclick="guardarDatosIniciales()">
                    <i class="fas fa-save"></i> Guardar
                </button>
                <button onclick="mostrarMenu('importar')" class="secondary-btn">
                    <i class="fas fa-upload"></i> Importar
                </button>
            </div>
        </form>
    `;
    modal.style.display = 'flex';
}

function verificarDatosIniciales() {
    const datos = JSON.parse(localStorage.getItem('ahorro'));
    actualizarBotonPrincipal();
    if (datos) cargarProgreso();
}
