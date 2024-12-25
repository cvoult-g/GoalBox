// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    cargarProgreso();
    actualizarListaEstadisticas();
    configurarNotificaciones();
    inicializarEventListeners();
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

function mostrarMensaje(icono, mensaje) {
    document.getElementById('resultado').innerHTML = `<i class="fas ${icono}"></i> ${mensaje}`;
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
    const metaAhorroTexto = document.getElementById("metaAhorroTexto");
    if (!metaAhorroInput || !metaAhorroTexto) return;

    const porcentaje = Math.min((valor / metaAhorroInput.value) * 100, 100);
    const progressBar = document.getElementById('progressBar');
    
    if (progressBar && progressBar.getAttribute('data-progress') !== String(Math.round(porcentaje))) {
        progressBar.style.width = porcentaje + '%';
        progressBar.setAttribute('data-progress', Math.round(porcentaje));
        metaAhorroTexto.textContent = `Falta: $${(metaAhorroInput.value - valor).toFixed(2)}`;
    }
}

// Manejo de ahorros
function manejarAhorro(isAddition) {
    const ahorroInput = document.getElementById('ahorro');
    const nuevoAhorroInput = document.getElementById('nuevoAhorro');
    const metaAhorroInput = document.getElementById('metaAhorroInput');
    
    const ahorroActual = parseFloat(ahorroInput.value) || 0;
    const nuevoAhorro = parseFloat(nuevoAhorroInput.value);
    const nuevaMeta = parseFloat(metaAhorroInput.value) || 0;

    if (esNumeroValido(nuevoAhorro) && nuevoAhorro > 0) {
        const nuevoTotal = isAddition ? 
            (ahorroActual + nuevoAhorro) : 
            Math.max(ahorroActual - nuevoAhorro, 0);
        
        const totalRedondeado = parseFloat(nuevoTotal.toFixed(2));
        ahorroInput.value = totalRedondeado;
        
        actualizarProgressBar(totalRedondeado);
        mostrarMensaje('fa-info-circle', 
            `Has ahorrado $${totalRedondeado.toFixed(2)} (${((totalRedondeado / nuevaMeta) * 100).toFixed(1)}% de tu meta)`);
        
        guardarEnEstadisticas(totalRedondeado);
        nuevoAhorroInput.value = '';
    } else {
        mostrarMensaje('fa-exclamation-triangle', 'Por favor ingresa una cantidad válida.');
    }
}

// Sistema de análisis
function calcularEstadisticas() {
    const estadisticas = JSON.parse(localStorage.getItem('estadisticas')) || [];
    if (estadisticas.length < 2) return null;

    const ahorros = estadisticas.map(e => e.ahorro);
    return {
        promedio: ahorros.reduce((a, b) => a + b, 0) / ahorros.length,
        maximo: Math.max(...ahorros),
        minimo: Math.min(...ahorros),
        tendencia: calcularTendencia(estadisticas),
        proyeccion: calcularProyeccion(estadisticas)
    };
}

function calcularTendencia(estadisticas) {
    const ultimos = estadisticas.slice(-3);
    if (ultimos.length < 2) return 'neutral';
    
    const diferencia = ultimos[ultimos.length - 1].ahorro - ultimos[0].ahorro;
    return diferencia > 0 ? 'positiva' : diferencia < 0 ? 'negativa' : 'neutral';
}

function calcularProyeccion(estadisticas) {
    const ultimos = estadisticas.slice(-3);
    if (ultimos.length < 2) return null;
    
    const cambioPromedio = (ultimos[ultimos.length - 1].ahorro - ultimos[0].ahorro) / (ultimos.length - 1);
    return ultimos[ultimos.length - 1].ahorro + (cambioPromedio * 3);
}

// Gestión de estadísticas
function guardarEnEstadisticas(ahorro) {
    const fecha = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const estadisticas = JSON.parse(localStorage.getItem('estadisticas')) || [];
    estadisticas.push({ ahorro, fecha });
    localStorage.setItem('estadisticas', JSON.stringify(estadisticas));
    actualizarListaEstadisticas();
}

function actualizarListaEstadisticas() {
    const estadisticas = JSON.parse(localStorage.getItem('estadisticas')) || [];
    const lista = document.getElementById('estadisticasList');
    lista.innerHTML = '';
    
    const analisis = calcularEstadisticas();
    if (analisis) {
        const headerStats = document.createElement('div');
        headerStats.className = 'stats-summary';
        headerStats.innerHTML = `
            <div class="stat-item">
                <i class="fas fa-chart-line"></i>
                <span>Promedio: $${analisis.promedio.toFixed(2)}</span>
            </div>
            <div class="stat-item">
                <i class="fas fa-arrow-up"></i>
                <span>Máximo: $${analisis.maximo.toFixed(2)}</span>
            </div>
            <div class="stat-item">
                <i class="fas fa-arrow-down"></i>
                <span>Mínimo: $${analisis.minimo.toFixed(2)}</span>
            </div>
            <div class="stat-item">
                <i class="fas fa-forecast"></i>
                <span>Proyección: $${analisis.proyeccion?.toFixed(2) || 'N/A'}</span>
            </div>
        `;
        lista.appendChild(headerStats);
    }

    estadisticas.slice(-10).reverse().forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <i class="fas fa-chart-line"></i>
            $${escaparHTML(item.ahorro.toFixed(2))}
            <small>${escaparHTML(item.fecha)}</small>
            ${item.etiqueta ? `<span class="tag">${escaparHTML(item.etiqueta)}</span>` : ''}
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
    if (!confirm('¿Estás seguro de que deseas eliminar todo tu progreso guardado?')) return;

    localStorage.removeItem('ahorro');
    localStorage.removeItem('estadisticas');
    
    ['ahorro', 'faltaPorAhorar', 'nuevoAhorro'].forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) elemento.value = '';
    });

    const estadisticasList = document.getElementById('estadisticasList');
    if (estadisticasList) estadisticasList.innerHTML = '';

    actualizarProgressBar(0);
    mostrarMensaje('fa-trash', 'Progreso eliminado correctamente');
}

// Exportación e importación
function exportarJSON() {
    const metaAhorroInput = document.getElementById("metaAhorroInput");
    const ahorroInput = document.getElementById('ahorro');
    
    if (!metaAhorroInput || !ahorroInput) {
        mostrarMensaje('fa-exclamation-circle', 'Error: No se pudo acceder a los datos');
        return;
    }

    const datos = {
        metaAhorro: parseFloat(metaAhorroInput.value) || 0,
        ahorro: parseFloat(ahorroInput.value) || 0,
        estadisticas: JSON.parse(localStorage.getItem('estadisticas')) || [],
        analisis: calcularEstadisticas(),
        fecha_exportacion: new Date().toISOString(),
        version: "2.0"
    };

    const jsonString = JSON.stringify(datos, null, 2);
    const blob = new Blob([jsonString], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `mis_ahorros_${new Date().toISOString().slice(0,10)}.json`;
    
    const exportarLink = document.getElementById('jsonExportarLink');
    exportarLink.innerHTML = '';
    exportarLink.appendChild(downloadLink);
    downloadLink.innerHTML = `<i class="fas fa-file-download"></i> Descargar JSON`;
    
    document.getElementById('jsonExportar').value = jsonString;
    mostrarMensaje('fa-check-circle', 'Datos exportados correctamente');
}

function importarJSON() {
    const archivo = document.getElementById('importarArchivo').files[0];
    const textoJSON = document.getElementById('jsonImportar').value;
    
    if (!archivo && !textoJSON) {
        mostrarMensaje('fa-exclamation-triangle', 'Por favor selecciona un archivo o pega el contenido JSON');
        return;
    }

    if (archivo) {
        const reader = new FileReader();
        reader.onload = e => procesarDatosImportados(e.target.result);
        reader.readAsText(archivo);
    } else {
        procesarDatosImportados(textoJSON);
    }
}

function procesarDatosImportados(contenidoJSON) {
    try {
        const datos = JSON.parse(contenidoJSON);
        if (datos.ahorro === undefined) {
            throw new Error('Formato JSON inválido');
        }

        localStorage.setItem('ahorro', JSON.stringify(datos));
        localStorage.setItem('estadisticas', JSON.stringify(datos.estadisticas || []));
        localStorage.setItem("metaAhorro", JSON.stringify(datos.metaAhorro));
        
        cargarProgreso();
        cerrarVentanaImportar();
        mostrarMensaje('fa-check', 'Datos importados correctamente');
    } catch (e) {
        mostrarMensaje('fa-exclamation-triangle', 'Error al procesar el archivo JSON');
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
    const metaAhorro = parseFloat(metaAhorroInput.value) || 0;
    const ahorroActual = parseFloat(document.getElementById('ahorro').value) || 0;
    const progreso = (ahorroActual / metaAhorro) * 100;

    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = `${progreso}%`;
    }

    const resultado = document.getElementById('resultado');
    if (resultado) {
        resultado.textContent = progreso >= 100 
            ? '¡Felicidades! Has alcanzado tu meta de ahorro.'
            : `Progreso: ${progreso.toFixed(2)}%`;
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
});

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